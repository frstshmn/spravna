<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudioMember;
use App\Models\User;
use App\Services\StudioService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudioController extends Controller
{
    public function __construct(private StudioService $service) {}

    /** GET /api/studio — studio the current user belongs to, plus pending invite if any. */
    public function show(Request $request): JsonResponse
    {
        $user   = $request->user();
        $studio = $this->service->findForUser($user);

        if (! $studio) {
            $pending = $this->service->pendingInvitationForUser($user);
            return response()->json([
                'studio'             => null,
                'pending_invitation' => $pending ? [
                    'token'      => $pending->invite_token,
                    'studio_name' => $pending->studio->name,
                ] : null,
            ]);
        }

        return response()->json($this->service->format($studio, $user));
    }

    /** POST /api/studio — create a new studio. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $studio = $this->service->create($request->user(), $data['name'], $data['description'] ?? null);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json($this->service->format($studio, $request->user()), 201);
    }

    /** PUT /api/studio — update name / description. */
    public function update(Request $request): JsonResponse
    {
        $user   = $request->user();
        $studio = $this->service->findForUser($user);
        if (! $studio || $studio->owner_id !== $user->id) {
            return response()->json(['error' => 'Тільки власник може редагувати студію.'], 403);
        }

        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'description' => 'nullable|string|max:500',
        ]);

        $studio->update($data);

        return response()->json($this->service->format($studio->fresh(), $user));
    }

    /** POST /api/studio/photo — upload studio photo. */
    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate(['photo' => 'required|image|max:3072']);

        $user   = $request->user();
        $studio = $this->service->findForUser($user);
        if (! $studio || $studio->owner_id !== $user->id) {
            return response()->json(['error' => 'Тільки власник може змінити фото студії.'], 403);
        }

        if ($studio->photo) {
            Storage::disk('public')->delete($studio->photo);
        }

        $path = $request->file('photo')->store('studios', 'public');
        $studio->update(['photo' => $path]);

        return response()->json(['photo_url' => '/storage/' . $path]);
    }

    /** POST /api/studio/invite — invite a user by email. */
    public function invite(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user   = $request->user();
        $studio = $this->service->findForUser($user);
        if (! $studio || $studio->owner_id !== $user->id) {
            return response()->json(['error' => 'Тільки власник може запрошувати учасників.'], 403);
        }

        try {
            $member = $this->service->invite($studio, $request->input('email'));
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Запрошення надіслано на ' . $member->email,
            'member'  => [
                'id'     => $member->id,
                'email'  => $member->email,
                'status' => $member->status,
            ],
        ], 201);
    }

    /** DELETE /api/studio/members/{userId} — remove or self-leave. */
    public function removeMember(Request $request, int $userId): JsonResponse
    {
        $user   = $request->user();
        $studio = $this->service->findForUser($user);

        if (! $studio) {
            return response()->json(['error' => 'Студію не знайдено.'], 404);
        }

        $target = $studio->members()->where('user_id', $userId)->first();
        if (! $target) {
            return response()->json(['error' => 'Учасника не знайдено.'], 404);
        }

        $isSelf  = $user->id === $userId;
        $isOwner = $studio->owner_id === $user->id;

        if (! $isSelf && ! $isOwner) {
            return response()->json(['error' => 'Недостатньо прав.'], 403);
        }
        if ($target->isOwner() && ! $isSelf) {
            return response()->json(['error' => 'Не можна видалити власника студії.'], 403);
        }

        $this->service->removeMember($target);

        return response()->json(['message' => 'Учасника видалено.']);
    }

    /** PUT /api/studio/members/{userId} — update member permissions (owner only). */
    public function updateMember(Request $request, int $userId): JsonResponse
    {
        $user   = $request->user();
        $studio = $this->service->findForUser($user);

        if (! $studio || $studio->owner_id !== $user->id) {
            return response()->json(['error' => 'Тільки власник може змінювати права.'], 403);
        }

        $target = $studio->members()->where('user_id', $userId)->where('status', 'active')->first();
        if (! $target) {
            return response()->json(['error' => 'Учасника не знайдено.'], 404);
        }

        $data = $request->validate([
            'can_view_calendar' => 'sometimes|boolean',
            'can_view_requests' => 'sometimes|boolean',
        ]);

        $this->service->updateMemberPermissions(
            $target,
            $data['can_view_calendar'] ?? $target->can_view_calendar,
            $data['can_view_requests'] ?? $target->can_view_requests,
        );

        return response()->json(['message' => 'Права оновлено.']);
    }

    /** GET /api/studio/members/{userId}/calendar — view another member's calendar. */
    public function memberCalendar(Request $request, int $userId): JsonResponse
    {
        $user   = $request->user();
        $studio = $this->service->findForUser($user);

        if (! $studio) {
            return response()->json(['error' => 'Студію не знайдено.'], 404);
        }

        $myMembership = $studio->members()->where('user_id', $user->id)->where('status', 'active')->first();
        $isOwner      = $studio->owner_id === $user->id;

        if (! $isOwner && (! $myMembership || ! $myMembership->can_view_calendar)) {
            return response()->json(['error' => 'Немає доступу до розкладу учасника.'], 403);
        }

        $target = $studio->members()->where('user_id', $userId)->where('status', 'active')->first();
        if (! $target || ! $target->user) {
            return response()->json(['error' => 'Учасника не знайдено.'], 404);
        }

        $from = Carbon::parse($request->query('from', now()->startOfWeek()));
        $to   = Carbon::parse($request->query('to', now()->endOfWeek()));

        $appointments = $target->user->appointments()
            ->with(['client', 'service'])
            ->whereBetween('scheduled_at', [$from->startOfDay(), $to->endOfDay()])
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn($a) => [
                'id'           => $a->id,
                'scheduled_at' => $a->scheduled_at->toIso8601String(),
                'duration'     => $a->duration,
                'status'       => $a->status,
                'price'        => $a->price,
                'client_name'  => $a->client?->name ?? $a->client_name ?? '—',
                'service_name' => $a->service?->name,
                'notes'        => $a->notes,
            ]);

        return response()->json([
            'member'       => ['id' => $target->user->id, 'name' => $target->user->name],
            'from'         => $from->toDateString(),
            'to'           => $to->toDateString(),
            'appointments' => $appointments,
        ]);
    }

    /** GET /api/studio/members/{userId}/requests — view another member's booking requests. */
    public function memberRequests(Request $request, int $userId): JsonResponse
    {
        $user   = $request->user();
        $studio = $this->service->findForUser($user);

        if (! $studio) {
            return response()->json(['error' => 'Студію не знайдено.'], 404);
        }

        $myMembership = $studio->members()->where('user_id', $user->id)->where('status', 'active')->first();
        $isOwner      = $studio->owner_id === $user->id;

        if (! $isOwner && (! $myMembership || ! $myMembership->can_view_requests)) {
            return response()->json(['error' => 'Немає доступу до запитів учасника.'], 403);
        }

        $target = $studio->members()->where('user_id', $userId)->where('status', 'active')->first();
        if (! $target || ! $target->user) {
            return response()->json(['error' => 'Учасника не знайдено.'], 404);
        }

        $requests = $target->user->bookingRequests()
            ->with('service')
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn($r) => [
                'id'             => $r->id,
                'client_name'    => $r->client_name,
                'client_phone'   => $r->client_phone,
                'client_email'   => $r->client_email,
                'service_name'   => $r->service?->name,
                'preferred_date' => $r->preferred_date,
                'preferred_time' => $r->preferred_time,
                'status'         => $r->status,
                'message'        => $r->message,
                'created_at'     => $r->created_at->toIso8601String(),
            ]);

        return response()->json([
            'member'   => ['id' => $target->user->id, 'name' => $target->user->name],
            'requests' => $requests,
        ]);
    }
}
