<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Models\Client;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->bookingRequests()->with('service');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $requests = $query->latest()->paginate($request->integer('per_page', 20));
        return response()->json($requests);
    }

    public function show(Request $request, BookingRequest $bookingRequest): JsonResponse
    {
        $this->authorize($request, $bookingRequest);
        return response()->json($bookingRequest->load('service'));
    }

    public function respond(Request $request, BookingRequest $bookingRequest): JsonResponse
    {
        $this->authorize($request, $bookingRequest);

        $data = $request->validate([
            'status'           => 'required|in:accepted,declined',
            'response_message' => 'nullable|string',
            // Fields for creating an appointment when accepting
            'scheduled_at'    => 'required_if:status,accepted|nullable|date',
            'duration'        => 'required_if:status,accepted|nullable|integer|min:15',
            'price'           => 'nullable|numeric|min:0',
        ]);

        $bookingRequest->update([
            'status'           => $data['status'],
            'response_message' => $data['response_message'] ?? null,
            'responded_at'     => now(),
        ]);

        $appointment = null;

        if ($data['status'] === 'accepted') {
            // Find or create client
            $client = $request->user()->clients()
                ->where('email', $bookingRequest->client_email)
                ->orWhere('phone', $bookingRequest->client_phone)
                ->first();

            if (!$client) {
                $client = $request->user()->clients()->create([
                    'name'      => $bookingRequest->client_name,
                    'email'     => $bookingRequest->client_email,
                    'phone'     => $bookingRequest->client_phone,
                    'instagram' => $bookingRequest->client_instagram,
                    'source'    => 'booking_request',
                ]);
            }

            $appointment = $request->user()->appointments()->create([
                'client_id'   => $client->id,
                'service_id'  => $bookingRequest->service_id,
                'scheduled_at' => $data['scheduled_at'],
                'duration'    => $data['duration'] ?? $bookingRequest->service?->duration ?? 60,
                'price'       => $data['price'],
                'status'      => 'confirmed',
                'notes'       => $bookingRequest->message,
            ]);

            $bookingRequest->update([
                'status'         => 'converted',
                'appointment_id' => $appointment->id,
            ]);
        }

        return response()->json([
            'booking_request' => $bookingRequest->fresh('service'),
            'appointment'     => $appointment?->load(['client', 'service']),
        ]);
    }

    public function destroy(Request $request, BookingRequest $bookingRequest): JsonResponse
    {
        $this->authorize($request, $bookingRequest);
        $bookingRequest->delete();
        return response()->json(null, 204);
    }

    private function authorize(Request $request, BookingRequest $bookingRequest): void
    {
        if ($bookingRequest->user_id !== $request->user()->id) {
            abort(403);
        }
    }
}
