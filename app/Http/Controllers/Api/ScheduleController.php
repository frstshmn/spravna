<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScheduleBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function getWorkingHours(Request $request): JsonResponse
    {
        $hours = $request->user()->workingHours()->orderBy('day_of_week')->get();
        return response()->json($hours);
    }

    public function updateWorkingHours(Request $request): JsonResponse
    {
        $data = $request->validate([
            'hours'                   => 'required|array',
            'hours.*.day_of_week'     => 'required|integer|min:0|max:6',
            'hours.*.start_time'      => 'required|date_format:H:i',
            'hours.*.end_time'        => 'required|date_format:H:i',
            'hours.*.is_working'      => 'required|boolean',
        ]);

        $user = $request->user();

        foreach ($data['hours'] as $hour) {
            $user->workingHours()->updateOrCreate(
                ['day_of_week' => $hour['day_of_week']],
                [
                    'start_time' => $hour['start_time'],
                    'end_time'   => $hour['end_time'],
                    'is_working' => $hour['is_working'],
                ]
            );
        }

        return response()->json($user->workingHours()->orderBy('day_of_week')->get());
    }

    public function getBlocks(Request $request): JsonResponse
    {
        $query = $request->user()->scheduleBlocks();

        if ($request->filled('from')) {
            $query->where('date', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('date', '<=', $request->to);
        }

        return response()->json($query->orderBy('date')->get());
    }

    public function storeBlock(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date'       => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time'   => 'nullable|date_format:H:i',
            'type'       => 'in:day_off,vacation,custom',
            'reason'     => 'nullable|string|max:255',
        ]);

        $block = $request->user()->scheduleBlocks()->create($data);
        return response()->json($block, 201);
    }

    public function destroyBlock(Request $request, ScheduleBlock $block): JsonResponse
    {
        if ($block->user_id !== $request->user()->id) {
            abort(403);
        }
        $block->delete();
        return response()->json(null, 204);
    }
}
