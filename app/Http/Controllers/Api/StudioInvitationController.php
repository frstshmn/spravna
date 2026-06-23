<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudioMember;
use App\Services\StudioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudioInvitationController extends Controller
{
    public function __construct(private StudioService $service) {}

    /** GET /api/studio/invitations/{token} — public: get invitation details. */
    public function show(string $token): JsonResponse
    {
        $member = StudioMember::where('invite_token', $token)
            ->where('status', 'pending')
            ->with('studio.owner')
            ->first();

        if (! $member) {
            return response()->json(['error' => 'Запрошення не знайдено або вже оброблено.'], 404);
        }

        return response()->json([
            'studio_name'  => $member->studio->name,
            'studio_photo' => $member->studio->photo_url,
            'invited_email' => $member->email,
        ]);
    }

    /** POST /api/studio/invitations/{token}/accept — authenticated. */
    public function accept(Request $request, string $token): JsonResponse
    {
        $member = StudioMember::where('invite_token', $token)
            ->where('status', 'pending')
            ->first();

        if (! $member) {
            return response()->json(['error' => 'Запрошення не знайдено або вже оброблено.'], 404);
        }

        try {
            $this->service->accept($member, $request->user());
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Ви приєдналися до студії!']);
    }

    /** POST /api/studio/invitations/{token}/decline — no auth needed. */
    public function decline(string $token): JsonResponse
    {
        $member = StudioMember::where('invite_token', $token)
            ->where('status', 'pending')
            ->first();

        if (! $member) {
            return response()->json(['error' => 'Запрошення не знайдено.'], 404);
        }

        $this->service->decline($member);

        return response()->json(['message' => 'Запрошення відхилено.']);
    }
}
