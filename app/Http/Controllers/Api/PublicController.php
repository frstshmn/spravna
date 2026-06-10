<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    public function masterProfile(string $slug): JsonResponse
    {
        $profile = MasterProfile::where('slug', $slug)
            ->where('is_public', true)
            ->firstOrFail();

        $user = $profile->user;

        $services = $user->services()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn($s) => [
                'id'            => $s->id,
                'name'          => $s->name,
                'description'   => $s->description,
                'category'      => $s->category,
                'price_display' => $s->price_display,
                'duration'      => $s->duration,
                'duration_display' => $s->duration_display,
                'color'         => $s->color,
            ]);

        $portfolio = $user->portfolioItems()
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($item) => [
                'id'          => $item->id,
                'title'       => $item->title,
                'description' => $item->description,
                'image_url'   => $item->image_url,
                'is_featured' => $item->is_featured,
                'service_id'  => $item->service_id,
            ]);

        return response()->json([
            'master' => [
                'id'                    => $user->id,
                'name'                  => $user->name,
                'slug'                  => $profile->slug,
                'bio'                   => $profile->bio,
                'specialty'             => $profile->specialty,
                'avatar_url'            => $profile->avatar_url,
                'city'                  => $profile->city,
                'country'               => $profile->country,
                'instagram'             => $profile->instagram,
                'website'               => $profile->website,
                'booking_notice'        => $profile->booking_notice,
                'cancellation_policy'   => $profile->cancellation_policy,
                'is_accepting_bookings' => $profile->is_accepting_bookings,
                'currency'              => $profile->currency,
                'social_links'          => $profile->social_links,
            ],
            'services'  => $services,
            'portfolio' => $portfolio,
        ]);
    }

    public function submitRequest(Request $request, string $slug): JsonResponse
    {
        $profile = MasterProfile::where('slug', $slug)
            ->where('is_public', true)
            ->where('is_accepting_bookings', true)
            ->firstOrFail();

        $data = $request->validate([
            'client_name'      => 'required|string|max:255',
            'client_email'     => 'nullable|email|max:255',
            'client_phone'     => 'nullable|string|max:50',
            'client_instagram' => 'nullable|string|max:100',
            'service_id'       => 'nullable|exists:services,id',
            'preferred_date'   => 'nullable|date|after:today',
            'preferred_time'   => 'nullable|string|max:10',
            'message'          => 'nullable|string|max:2000',
        ]);

        // Verify service belongs to this master
        if (!empty($data['service_id'])) {
            $profile->user->services()->findOrFail($data['service_id']);
        }

        $bookingRequest = $profile->user->bookingRequests()->create(array_merge($data, [
            'source' => 'public_page',
        ]));

        return response()->json([
            'message' => 'Your request has been submitted. The master will contact you shortly.',
            'id'      => $bookingRequest->id,
        ], 201);
    }
}
