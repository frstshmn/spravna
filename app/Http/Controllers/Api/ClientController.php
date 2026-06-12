<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Services\InstagramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->clients();

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(fn($q) => $q
                ->where('name', 'like', $search)
                ->orWhere('email', 'like', $search)
                ->orWhere('phone', 'like', $search)
            );
        }

        if ($request->boolean('vip')) {
            $query->where('is_vip', true);
        }

        $clients = $query->withCount(['appointments as total_visits' => fn($q) => $q->where('status', 'completed')])
            ->withSum(['appointments as total_spent_sum' => fn($q) => $q->where('status', 'completed')], 'price')
            ->withMax(['appointments as last_visit_at' => fn($q) => $q->where('status', 'completed')], 'scheduled_at')
            ->orderBy('name')
            ->paginate($request->integer('per_page', 30));

        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'nullable|email|max:255',
            'phone'         => 'nullable|string|max:50',
            'birthday'      => 'nullable|date',
            'notes'         => 'nullable|string',
            'medical_notes' => 'nullable|string',
            'instagram'     => 'nullable|string|max:100',
            'source'        => 'nullable|string|max:100',
            'is_vip'        => 'boolean',
        ]);

        if (!empty($data['instagram'])) {
            $avatarUrl = app(InstagramService::class)->fetchAvatar($data['instagram']);
            if ($avatarUrl) {
                $data['avatar_url'] = $avatarUrl;
            }
        }

        $client = $request->user()->clients()->create($data);
        return response()->json($client, 201);
    }

    public function show(Request $request, Client $client): JsonResponse
    {
        $this->authorizeClient($request, $client);

        $client->load(['appointments' => fn($q) => $q->with('service')->orderByDesc('scheduled_at')->limit(50)]);

        $spendingByService = $client->appointments()
            ->where('status', 'completed')
            ->selectRaw('service_id, COUNT(*) as count, SUM(price) as total')
            ->groupBy('service_id')
            ->with('service:id,name,color')
            ->get();

        return response()->json([
            'client'              => $client,
            'total_spent'         => $client->total_spent,
            'visits_count'        => $client->visits_count,
            'spending_by_service' => $spendingByService,
        ]);
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $this->authorizeClient($request, $client);

        $data = $request->validate([
            'name'          => 'string|max:255',
            'email'         => 'nullable|email|max:255',
            'phone'         => 'nullable|string|max:50',
            'birthday'      => 'nullable|date',
            'notes'         => 'nullable|string',
            'medical_notes' => 'nullable|string',
            'instagram'     => 'nullable|string|max:100',
            'source'        => 'nullable|string|max:100',
            'is_vip'        => 'boolean',
            'is_blocked'    => 'boolean',
        ]);

        if (!empty($data['instagram']) && $data['instagram'] !== $client->instagram) {
            $avatarUrl = app(InstagramService::class)->fetchAvatar($data['instagram']);
            if ($avatarUrl) {
                $data['avatar_url'] = $avatarUrl;
            }
        }

        $client->update($data);
        return response()->json($client);
    }

    public function destroy(Request $request, Client $client): JsonResponse
    {
        $this->authorizeClient($request, $client);
        $client->delete();
        return response()->json(null, 204);
    }

    private function authorizeClient(Request $request, Client $client): void
    {
        if ($client->user_id !== $request->user()->id) {
            abort(403);
        }
    }
}
