<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PortfolioItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortfolioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = $request->user()->portfolioItems()
            ->with('service')
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($items->map(fn($item) => array_merge(
            $item->toArray(),
            ['image_url' => $item->image_url]
        )));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'image'       => 'required|image|max:5120',
            'title'       => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'service_id'  => 'nullable|exists:services,id',
            'is_featured' => 'boolean',
        ]);

        $path = $request->file('image')->store('portfolio', 'public');

        $item = $request->user()->portfolioItems()->create([
            'image_path'  => $path,
            'title'       => $request->title,
            'description' => $request->description,
            'service_id'  => $request->service_id,
            'is_featured' => $request->boolean('is_featured'),
        ]);

        return response()->json(array_merge($item->toArray(), ['image_url' => $item->image_url]), 201);
    }

    public function destroy(Request $request, PortfolioItem $portfolioItem): JsonResponse
    {
        if ($portfolioItem->user_id !== $request->user()->id) {
            abort(403);
        }

        Storage::disk('public')->delete($portfolioItem->image_path);
        $portfolioItem->delete();

        return response()->json(null, 204);
    }
}
