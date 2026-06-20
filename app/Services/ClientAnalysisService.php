<?php

namespace App\Services;

use App\Models\Client;
use App\Models\ClientAnalysis;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class ClientAnalysisService
{
    private const SYSTEM_PROMPT = <<<'PROMPT'
You are a financial analyst assistant for solo beauty and art masters (tattoo artists, nail technicians, hairdressers, etc.).
Analyze one month of data for a single client and provide concise insights.
Respond ONLY with valid JSON in this exact format: {"highlights":["..."],"suggestions":["..."]}
- "highlights": 0–5 brief observations about this client's visit and payment patterns
- "suggestions": 0–5 actionable recommendations for working with this client
Rules:
- Use ONLY the data provided. Never invent or assume any facts not explicitly given.
- Write ALL text in Ukrainian.
- Keep each item concise (1–2 sentences).
- Return ONLY the raw JSON object. No markdown, no explanations, no extra keys.
PROMPT;

    public function __construct(private AnthropicService $anthropic) {}

    public function getOrGenerate(User $user, int $clientId, string $period): ?ClientAnalysis
    {
        $cached = $this->findCached($user->id, $clientId, $period);

        if ($cached) {
            return $cached;
        }

        return $this->generate($user, $clientId, $period, 'auto');
    }

    /**
     * Force a refresh; throws \RuntimeException if last analysis was less than 1 hour ago.
     */
    public function refresh(User $user, int $clientId, string $period): ?ClientAnalysis
    {
        $cached = $this->findCached($user->id, $clientId, $period);

        if ($cached && $cached->generated_at->diffInMinutes(now()) < 60) {
            throw new \RuntimeException('Аналіз вже оновлювався нещодавно. Зачекайте щонайменше 1 годину.');
        }

        return $this->generate($user, $clientId, $period, 'manual', $cached);
    }

    private function generate(
        User $user,
        int $clientId,
        string $period,
        string $generationType,
        ?ClientAnalysis $existing = null,
    ): ?ClientAnalysis {
        $client = $user->clients()->find($clientId);

        if (! $client) {
            throw new \RuntimeException('client_not_found');
        }

        $prompt = $this->buildPrompt($user, $client, $period);

        $result = $this->callWithRetry($prompt, $existing);

        if (! $result) {
            return $existing;
        }

        return ClientAnalysis::updateOrCreate(
            ['user_id' => $user->id, 'client_id' => $clientId, 'period' => $period],
            [
                'highlights'      => $result['highlights'],
                'suggestions'     => $result['suggestions'],
                'generated_at'    => now(),
                'generation_type' => $generationType,
            ],
        );
    }

    private function callWithRetry(string $prompt, ?ClientAnalysis $fallback): ?array
    {
        try {
            return $this->anthropic->sendMessage(self::SYSTEM_PROMPT, $prompt);
        } catch (\RuntimeException $first) {
            if (str_contains($first->getMessage(), 'invalid JSON') || str_contains($first->getMessage(), 'missing required keys')) {
                try {
                    return $this->anthropic->sendMessage(self::SYSTEM_PROMPT, $prompt);
                } catch (\RuntimeException $second) {
                    Log::warning('ClientAnalysis retry failed', ['error' => $second->getMessage()]);
                    return null;
                }
            }

            Log::warning('ClientAnalysis AI call failed', ['error' => $first->getMessage()]);
            return null;
        }
    }

    private function findCached(int $userId, int $clientId, string $period): ?ClientAnalysis
    {
        return ClientAnalysis::where('user_id', $userId)
            ->where('client_id', $clientId)
            ->where('period', $period)
            ->first();
    }

    private function buildPrompt(User $user, Client $client, string $period): string
    {
        [$year, $month] = explode('-', $period);
        $from = Carbon::create((int) $year, (int) $month)->startOfMonth();
        $to   = $from->copy()->endOfMonth();

        $appts     = $user->appointments()->with('service')->where('client_id', $client->id)->whereBetween('scheduled_at', [$from, $to])->get();
        $completed = $appts->where('status', 'completed');
        $cancelled = $appts->where('status', 'cancelled');
        $noShow    = $appts->where('status', 'no_show');

        $revenue  = (float) $completed->sum('price');
        $avgPrice = $completed->count() > 0 ? round($revenue / $completed->count(), 2) : 0;

        $services = $completed
            ->map(fn($a) => $a->service?->name)
            ->filter()
            ->unique()
            ->values()
            ->implode(', ');

        $allCompleted = $user->appointments()->where('client_id', $client->id)->where('status', 'completed')->get();
        $firstVisit   = $user->appointments()->where('client_id', $client->id)->orderBy('scheduled_at')->value('scheduled_at');
        $firstStr     = $firstVisit ? Carbon::parse($firstVisit)->format('d.m.Y') : 'невідомо';
        $monthName    = $from->locale('uk')->monthName . ' ' . $year;

        return implode("\n", [
            "Клієнт: {$client->name}",
            "Період аналізу: {$monthName}",
            '',
            'Статистика за місяць:',
            "- Всього записів: {$appts->count()}",
            "- Завершено: {$completed->count()}",
            "- Скасовано: {$cancelled->count()}",
            "- Не прийшов/ла (no-show): {$noShow->count()}",
            "- Дохід від клієнта за місяць: {$revenue} грн",
            "- Середній чек: {$avgPrice} грн",
            '- Послуги: ' . ($services ?: 'немає даних'),
            '',
            'Загальна статистика (за весь час):',
            "- Перший візит: {$firstStr}",
            "- Кількість завершених візитів: {$allCompleted->count()}",
            "- Загальний дохід від клієнта: {$allCompleted->sum('price')} грн",
        ]);
    }
}
