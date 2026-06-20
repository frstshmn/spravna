<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientAnalysis;
use App\Services\ClientAnalysisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientAnalysisController extends Controller
{
    public function __construct(private ClientAnalysisService $service) {}

    public function show(Request $request, int $clientId): JsonResponse
    {
        $period = $request->get('period', now()->format('Y-m'));

        try {
            $analysis = $this->service->getOrGenerate($request->user(), $clientId, $period);
        } catch (\RuntimeException $e) {
            return $e->getMessage() === 'client_not_found'
                ? response()->json(['error' => 'Клієнта не знайдено'], 404)
                : response()->json(['error' => $e->getMessage()], 503);
        }

        if (! $analysis) {
            return response()->json(['error' => 'AI-сервіс тимчасово недоступний. Перевірте налаштування та спробуйте пізніше.'], 503);
        }

        return response()->json($this->format($analysis));
    }

    public function refresh(Request $request, int $clientId): JsonResponse
    {
        $period = $request->get('period', now()->format('Y-m'));

        try {
            $analysis = $this->service->refresh($request->user(), $clientId, $period);
        } catch (\RuntimeException $e) {
            $status = match($e->getMessage()) {
                'client_not_found' => 404,
                default => str_contains($e->getMessage(), 'Зачекайте') ? 429 : 503,
            };
            return response()->json(['error' => $e->getMessage() === 'client_not_found' ? 'Клієнта не знайдено' : $e->getMessage()], $status);
        }

        if (! $analysis) {
            return response()->json(['error' => 'AI-сервіс тимчасово недоступний. Перевірте налаштування та спробуйте пізніше.'], 503);
        }

        return response()->json($this->format($analysis));
    }

    private function format(ClientAnalysis $analysis): array
    {
        return [
            'period'          => $analysis->period,
            'highlights'      => $analysis->highlights,
            'suggestions'     => $analysis->suggestions,
            'generated_at'    => $analysis->generated_at->toIso8601String(),
            'generation_type' => $analysis->generation_type,
        ];
    }
}
