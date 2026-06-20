<?php

namespace App\Services;

use App\Models\UserAnalysis;
use App\Models\User;
use Illuminate\Support\Carbon;

class UserAnalysisService
{
    private const SYSTEM_PROMPT = <<<'PROMPT'
You are a financial analyst assistant for solo beauty and art masters (tattoo artists, nail technicians, hairdressers, etc.).
Analyze one month of the master's business data and provide concise insights.
Respond ONLY with valid JSON: {"highlights":["..."],"suggestions":["..."]}
- "highlights": 0–5 key observations about their business performance this month
- "suggestions": 0–5 actionable recommendations to improve their business
Rules:
- Use ONLY the data provided. Never invent or assume any facts not in the input.
- Write ALL text in Ukrainian.
- Keep each item concise (1–2 sentences).
- Return ONLY the raw JSON object. No markdown, no explanations, no extra keys.
PROMPT;

    public function __construct(private AnthropicService $anthropic) {}

    public function getCached(User $user, string $period): ?UserAnalysis
    {
        return UserAnalysis::where('user_id', $user->id)->where('period', $period)->first();
    }

    /**
     * Generate a new analysis. Throws \RuntimeException('cooldown:{seconds}') if < 60 min since last.
     */
    public function generate(User $user, string $period): UserAnalysis
    {
        $cached = $this->getCached($user, $period);

        if ($cached) {
            $secondsLeft = 3600 - (int) $cached->generated_at->diffInSeconds(now());
            if ($secondsLeft > 0) {
                throw new \RuntimeException('cooldown:' . $secondsLeft);
            }
        }

        $prompt = $this->buildPrompt($user, $period);
        $result = $this->callWithRetry($prompt);

        return UserAnalysis::updateOrCreate(
            ['user_id' => $user->id, 'period' => $period],
            [
                'highlights'      => $result['highlights'],
                'suggestions'     => $result['suggestions'],
                'generated_at'    => now(),
                'generation_type' => 'manual',
            ],
        );
    }

    private function callWithRetry(string $prompt): array
    {
        try {
            return $this->anthropic->sendMessage(self::SYSTEM_PROMPT, $prompt);
        } catch (\RuntimeException $e) {
            if (str_contains($e->getMessage(), 'invalid JSON') || str_contains($e->getMessage(), 'missing required keys')) {
                try {
                    return $this->anthropic->sendMessage(self::SYSTEM_PROMPT, $prompt);
                } catch (\RuntimeException) {
                    throw new \RuntimeException('AI-сервіс повернув некоректну відповідь. Спробуйте пізніше.');
                }
            }
            throw new \RuntimeException('AI-сервіс тимчасово недоступний. Перевірте налаштування API ключа.');
        }
    }

    private function buildPrompt(User $user, string $period): string
    {
        [$year, $month] = explode('-', $period);
        $from = Carbon::create((int) $year, (int) $month)->startOfMonth();
        $to   = $from->copy()->endOfMonth();

        $appts     = $user->appointments()->with('service')->whereBetween('scheduled_at', [$from, $to])->get();
        $completed = $appts->where('status', 'completed');
        $cancelled = $appts->where('status', 'cancelled');
        $noShow    = $appts->where('status', 'no_show');

        $revenue  = (float) $completed->sum('price');
        $avgPrice = $completed->count() > 0 ? round($revenue / $completed->count(), 2) : 0;

        $clientIds = $appts->pluck('client_id')->filter()->unique();
        $returning = 0;
        foreach ($clientIds as $cid) {
            if ($user->appointments()->where('client_id', $cid)->where('scheduled_at', '<', $from)->exists()) {
                $returning++;
            }
        }
        $new = $clientIds->count() - $returning;

        $expenses  = $user->expenses()->whereBetween('date', [$from->toDateString(), $to->toDateString()])->get();
        $totalExp  = (float) $expenses->sum('amount');
        $expByCat  = $expenses->groupBy('category')
            ->map(fn($g) => $g->first()->category . ': ' . (float) $g->sum('amount') . ' грн')
            ->values()->implode(', ');

        $topServices = $completed->whereNotNull('service_id')
            ->groupBy('service_id')
            ->map(fn($g) => ($g->first()->service?->name ?? '—') . ' (' . $g->count() . ' сес., ' . (float) $g->sum('price') . ' грн)')
            ->values()->take(5)->implode('; ');

        $monthName = $from->locale('uk')->monthName . ' ' . $year;

        return implode("\n", [
            "Майстер: {$user->name}",
            "Період: {$monthName}",
            '',
            'Фінансові показники:',
            "- Дохід: {$revenue} грн",
            "- Витрати: {$totalExp} грн",
            '- Прибуток: ' . ($revenue - $totalExp) . ' грн',
            "- Середній чек: {$avgPrice} грн",
            '',
            'Записи:',
            "- Всього: {$appts->count()}, завершено: {$completed->count()}, скасовано: {$cancelled->count()}, не прийшли: {$noShow->count()}",
            '',
            "Клієнти: нових {$new}, постійних {$returning}",
            '',
            'Топ послуги: ' . ($topServices ?: 'немає даних'),
            'Витрати за категоріями: ' . ($expByCat ?: 'немає витрат'),
        ]);
    }
}
