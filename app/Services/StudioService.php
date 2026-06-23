<?php

namespace App\Services;

use App\Mail\StudioInvitation;
use App\Models\Studio;
use App\Models\StudioMember;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class StudioService
{
    const MAX_MEMBERS = 5;

    /** Return the studio (with members) the user belongs to, or null. */
    public function findForUser(User $user): ?Studio
    {
        // Owner
        $studio = Studio::where('owner_id', $user->id)->first();
        if ($studio) return $studio;

        // Active member
        $membership = StudioMember::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();
        if ($membership) return $membership->studio;

        return null;
    }

    /** Return pending invitation for this user's email, or null. */
    public function pendingInvitationForUser(User $user): ?StudioMember
    {
        return StudioMember::where('email', $user->email)
            ->where('status', 'pending')
            ->with('studio')
            ->first();
    }

    public function create(User $owner, string $name, ?string $description = null): Studio
    {
        if ($this->findForUser($owner)) {
            throw new \RuntimeException('Ви вже є учасником або власником студії.');
        }

        $slug = $this->uniqueSlug($name);

        $studio = Studio::create([
            'owner_id'    => $owner->id,
            'name'        => $name,
            'slug'        => $slug,
            'description' => $description,
        ]);

        // Add owner as active member
        StudioMember::create([
            'studio_id'          => $studio->id,
            'user_id'            => $owner->id,
            'email'              => $owner->email,
            'role'               => 'owner',
            'status'             => 'active',
            'can_view_calendar'  => true,
            'can_view_requests'  => true,
            'joined_at'          => now(),
        ]);

        $owner->update(['plan' => 'studio']);

        return $studio;
    }

    public function invite(Studio $studio, string $email): StudioMember
    {
        $activeCount = $studio->activeMembers()->count();
        if ($activeCount >= self::MAX_MEMBERS) {
            throw new \RuntimeException('Студія вже має максимальну кількість учасників (' . self::MAX_MEMBERS . ').');
        }

        // Check user exists
        $invitee = User::where('email', $email)->first();
        if (! $invitee) {
            throw new \RuntimeException('Користувача з таким email не знайдено.');
        }

        // Already a member anywhere
        if ($this->findForUser($invitee)) {
            throw new \RuntimeException('Цей користувач вже є учасником студії.');
        }

        // Already invited to this studio
        if ($studio->members()->where('email', $email)->exists()) {
            throw new \RuntimeException('Цей користувач вже запрошений до студії.');
        }

        $member = StudioMember::create([
            'studio_id'   => $studio->id,
            'user_id'     => $invitee->id,
            'email'       => $email,
            'role'        => 'member',
            'status'      => 'pending',
            'invite_token' => Str::random(40),
            'invited_at'  => now(),
        ]);

        Mail::to($email)->send(new StudioInvitation($member->load('studio')));

        return $member;
    }

    public function accept(StudioMember $member, User $user): void
    {
        if ($member->user_id !== $user->id) {
            throw new \RuntimeException('Це запрошення не для вашого акаунту.');
        }
        if ($member->status !== 'pending') {
            throw new \RuntimeException('Запрошення вже оброблено.');
        }
        if ($this->findForUser($user)) {
            throw new \RuntimeException('Ви вже є учасником іншої студії.');
        }

        $member->update([
            'status'      => 'active',
            'invite_token' => null,
            'joined_at'   => now(),
        ]);

        $user->update(['plan' => 'studio']);
    }

    public function decline(StudioMember $member): void
    {
        $member->delete();
    }

    public function removeMember(StudioMember $member): void
    {
        $user = $member->user;
        $wasOwner = $member->isOwner();

        $member->delete();

        if ($user && ! $wasOwner) {
            $user->update(['plan' => 'free']);
        }
    }

    public function updateMemberPermissions(StudioMember $member, bool $canViewCalendar, bool $canViewRequests): void
    {
        $member->update([
            'can_view_calendar' => $canViewCalendar,
            'can_view_requests' => $canViewRequests,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i    = 2;
        while (Studio::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }

    /** Format studio + members for API response. */
    public function format(Studio $studio, User $currentUser): array
    {
        $myMembership = $studio->members()
            ->where('user_id', $currentUser->id)
            ->first();

        $isOwner = $myMembership?->isOwner() || $studio->owner_id === $currentUser->id;

        $members = $studio->members()
            ->with('user.profile')
            ->orderByRaw("role = 'owner' DESC")
            ->orderBy('joined_at')
            ->get()
            ->map(fn(StudioMember $m) => [
                'id'                 => $m->id,
                'user_id'            => $m->user_id,
                'email'              => $m->email,
                'name'               => $m->user?->name ?? $m->email,
                'avatar_url'         => $m->user?->profile?->avatar_url,
                'specialty'          => $m->user?->profile?->specialty,
                'role'               => $m->role,
                'status'             => $m->status,
                'can_view_calendar'  => $m->can_view_calendar,
                'can_view_requests'  => $m->can_view_requests,
                'joined_at'          => $m->joined_at?->toIso8601String(),
            ]);

        return [
            'studio' => [
                'id'          => $studio->id,
                'name'        => $studio->name,
                'slug'        => $studio->slug,
                'description' => $studio->description,
                'photo_url'   => $studio->photo_url,
                'public_url'  => url('/studio/' . $studio->slug),
            ],
            'my_role'    => $myMembership?->role ?? ($isOwner ? 'owner' : null),
            'membership' => $myMembership ? [
                'can_view_calendar' => $myMembership->can_view_calendar,
                'can_view_requests' => $myMembership->can_view_requests,
            ] : null,
            'members'        => $members,
            'members_count'  => $members->count(),
            'can_invite_more' => $studio->activeMembers()->count() < self::MAX_MEMBERS,
        ];
    }
}
