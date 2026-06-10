<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $user->appointments()->with(['client', 'service']);

        // Calendar range filter
        if ($request->filled('start') && $request->filled('end')) {
            $query->whereBetween('scheduled_at', [
                Carbon::parse($request->start)->startOfDay(),
                Carbon::parse($request->end)->endOfDay(),
            ]);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        $appointments = $query->orderBy('scheduled_at')->get();

        // Format for calendar
        if ($request->boolean('calendar')) {
            return response()->json($appointments->map(fn($a) => [
                'id'    => $a->id,
                'title' => $a->title_display . ' — ' . $a->client->name,
                'start' => $a->scheduled_at->toIso8601String(),
                'end'   => $a->ends_at->toIso8601String(),
                'color' => $a->color ?? $a->service?->color ?? Appointment::statusColor($a->status),
                'extendedProps' => [
                    'status'  => $a->status,
                    'client'  => $a->client->name,
                    'service' => $a->service?->name,
                    'price'   => $a->price,
                ],
            ]));
        }

        return response()->json($appointments);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id'     => 'required|exists:clients,id',
            'service_id'    => 'nullable|exists:services,id',
            'title'         => 'nullable|string|max:255',
            'scheduled_at'  => 'required|date',
            'duration'      => 'required|integer|min:15',
            'status'        => 'in:pending,confirmed,in_progress,completed,cancelled,no_show',
            'price'         => 'nullable|numeric|min:0',
            'deposit'       => 'nullable|numeric|min:0',
            'deposit_paid'  => 'boolean',
            'notes'         => 'nullable|string',
            'internal_notes' => 'nullable|string',
            'color'         => 'nullable|string|max:7',
        ]);

        // Verify client belongs to this master
        $request->user()->clients()->findOrFail($data['client_id']);

        $appointment = $request->user()->appointments()->create($data);

        return response()->json($appointment->load(['client', 'service']), 201);
    }

    public function show(Request $request, Appointment $appointment): JsonResponse
    {
        $this->authorizeAppointment($request, $appointment);
        return response()->json($appointment->load(['client', 'service']));
    }

    public function update(Request $request, Appointment $appointment): JsonResponse
    {
        $this->authorizeAppointment($request, $appointment);

        $data = $request->validate([
            'client_id'      => 'exists:clients,id',
            'service_id'     => 'nullable|exists:services,id',
            'title'          => 'nullable|string|max:255',
            'scheduled_at'   => 'date',
            'duration'       => 'integer|min:15',
            'status'         => 'in:pending,confirmed,in_progress,completed,cancelled,no_show',
            'price'          => 'nullable|numeric|min:0',
            'deposit'        => 'nullable|numeric|min:0',
            'deposit_paid'   => 'boolean',
            'notes'          => 'nullable|string',
            'internal_notes' => 'nullable|string',
            'color'          => 'nullable|string|max:7',
        ]);

        $appointment->update($data);
        return response()->json($appointment->load(['client', 'service']));
    }

    public function destroy(Request $request, Appointment $appointment): JsonResponse
    {
        $this->authorizeAppointment($request, $appointment);
        $appointment->delete();
        return response()->json(null, 204);
    }

    public function archive(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->integer('per_page', 20);

        $appointments = $user->appointments()
            ->with(['client', 'service'])
            ->whereIn('status', ['completed', 'cancelled', 'no_show'])
            ->orderByDesc('scheduled_at')
            ->paginate($perPage);

        return response()->json($appointments);
    }

    private function authorizeAppointment(Request $request, Appointment $appointment): void
    {
        if ($appointment->user_id !== $request->user()->id) {
            abort(403);
        }
    }
}
