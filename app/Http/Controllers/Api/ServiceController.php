<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $services = $request->user()->services()
            ->when($request->boolean('active_only'), fn($q) => $q->where('is_active', true))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json($services);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'category'       => 'nullable|string|max:100',
            'price'          => 'nullable|numeric|min:0',
            'price_from'     => 'nullable|numeric|min:0',
            'price_to'       => 'nullable|numeric|min:0',
            'price_on_request' => 'boolean',
            'duration'       => 'required|integer|min:15',
            'color'          => 'nullable|string|max:7',
            'is_active'      => 'boolean',
            'sort_order'     => 'integer',
        ]);

        $service = $request->user()->services()->create($data);
        return response()->json($service, 201);
    }

    public function show(Request $request, Service $service): JsonResponse
    {
        $this->authorizeService($request, $service);
        return response()->json($service);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $this->authorizeService($request, $service);

        $data = $request->validate([
            'name'           => 'string|max:255',
            'description'    => 'nullable|string',
            'category'       => 'nullable|string|max:100',
            'price'          => 'nullable|numeric|min:0',
            'price_from'     => 'nullable|numeric|min:0',
            'price_to'       => 'nullable|numeric|min:0',
            'price_on_request' => 'boolean',
            'duration'       => 'integer|min:15',
            'color'          => 'nullable|string|max:7',
            'is_active'      => 'boolean',
            'sort_order'     => 'integer',
        ]);

        $service->update($data);
        return response()->json($service);
    }

    public function destroy(Request $request, Service $service): JsonResponse
    {
        $this->authorizeService($request, $service);
        $service->delete();
        return response()->json(null, 204);
    }

    private function authorizeService(Request $request, Service $service): void
    {
        if ($service->user_id !== $request->user()->id) {
            abort(403);
        }
    }
}
