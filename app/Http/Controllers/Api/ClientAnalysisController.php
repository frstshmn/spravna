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
        $period   = $request->get('period', now()->format('Y-m'));
        $analysis = $this->service->getOrGenerate($request->user(), $clientId, $period);

        if (! $analysis) {
            return response()->json(['error' => 'Client not found'], 404);
        }

        return response()->json($this->format($analysis));
    }

    public function refresh(Request $request, int $clientId): JsonResponse
    {
        $period = $request->get('period', now()->format('Y-m'));

        try {
            $analysis = $this->service->refresh($request->user(), $clientId, $period);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 429);
        }

        if (! $analysis) {
            return response()->json(['error' => 'Client not found'], 404);
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
