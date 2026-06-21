<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserAnalysis;
use App\Services\UserAnalysisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserAnalysisController extends Controller
{
    public function __construct(private UserAnalysisService $service) {}

    public function show(Request $request): JsonResponse
    {
        $period   = $request->get('period', now()->format('Y-m'));
        $analysis = $this->service->getCached($request->user(), $period);

        if (! $analysis) {
            $retryAfter = $this->service->globalCooldownSeconds($request->user());
            return response()->json(['exists' => false, 'retry_after' => $retryAfter], 404);
        }

        return response()->json($this->format($analysis));
    }

    public function generate(Request $request): JsonResponse
    {
        $period = $request->get('period', now()->format('Y-m'));

        try {
            $analysis = $this->service->generate($request->user(), $period);
        } catch (\RuntimeException $e) {
            if (str_starts_with($e->getMessage(), 'cooldown:')) {
                $seconds = (int) substr($e->getMessage(), 9);
                return response()->json(['error' => 'Занадто рано. Зачекайте перед наступною генерацією.', 'retry_after' => $seconds], 429);
            }
            return response()->json(['error' => $e->getMessage()], 503);
        }

        return response()->json($this->format($analysis));
    }

    private function format(UserAnalysis $analysis): array
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
