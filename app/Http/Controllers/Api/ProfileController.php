<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('profile'));
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $userData = $request->validate([
            'name' => 'string|max:255',
        ]);

        $profileData = $request->validate([
            'bio'                  => 'nullable|string',
            'specialty'            => 'nullable|string|max:100',
            'phone'                => 'nullable|string|max:50',
            'city'                 => 'nullable|string|max:100',
            'country'              => 'nullable|string|max:100',
            'instagram'            => 'nullable|string|max:100',
            'website'              => 'nullable|url|max:255',
            'booking_notice'       => 'nullable|string|max:255',
            'cancellation_policy'  => 'nullable|string',
            'is_public'            => 'boolean',
            'is_accepting_bookings' => 'boolean',
            'currency'             => 'string|size:3',
            'social_links'         => 'nullable|array',
        ]);

        if (!empty($userData)) {
            $user->update($userData);
        }

        $profile = $user->profile ?? $user->profile()->create([
            'slug' => Str::slug($user->name) . '-' . $user->id,
        ]);

        $profile->update($profileData);

        return response()->json($user->fresh()->load('profile'));
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate(['avatar' => 'required|image|max:2048']);

        $user = $request->user();
        $profile = $user->profile ?? $user->profile()->create([
            'slug' => Str::slug($user->name) . '-' . $user->id,
        ]);

        if ($profile->avatar) {
            Storage::disk('public')->delete($profile->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $profile->update(['avatar' => $path]);

        return response()->json(['avatar' => $path, 'avatar_url' => asset('storage/' . $path)]);
    }

    public function completeOnboarding(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->update(['onboarding_completed_at' => now()]);

        return response()->json($user->fresh()->load('profile'));
    }
}
