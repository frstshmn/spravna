<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Studio;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicStudioController extends Controller
{
    /** GET /api/studios/{slug} — studio info + all active masters. */
    public function show(string $slug): JsonResponse
    {
        $studio = Studio::where('slug', $slug)
            ->with(['activeMembers.user.profile', 'activeMembers.user.services', 'activeMembers.user.portfolioItems'])
            ->firstOrFail();

        $masters = $studio->activeMembers
            ->filter(fn($m) => $m->user && $m->user->profile?->is_public)
            ->map(fn($m) => $this->formatMaster($m->user));

        return response()->json([
            'studio' => [
                'name'        => $studio->name,
                'slug'        => $studio->slug,
                'description' => $studio->description,
                'photo_url'   => $studio->photo_url,
            ],
            'masters' => $masters->values(),
        ]);
    }

    /** GET /api/studios/{slug}/masters/{masterId}/availability */
    public function masterAvailability(Request $request, string $slug, int $masterId): JsonResponse
    {
        $studio = Studio::where('slug', $slug)->firstOrFail();
        $member = $studio->activeMembers()->where('user_id', $masterId)->firstOrFail();
        $user   = $member->user;
        $profile = $user->profile;

        if (! $profile || ! $profile->show_availability) {
            return response()->json(['enabled' => false]);
        }

        $today     = Carbon::today();
        $requested = $request->query('month');
        $month     = $requested
            ? Carbon::createFromFormat('Y-m', $requested)->startOfMonth()
            : $today->copy()->startOfMonth();

        $minMonth = $today->copy()->startOfMonth();
        $maxMonth = $today->copy()->startOfMonth()->addMonths(2);
        if ($month->lt($minMonth)) $month = $minMonth;
        if ($month->gt($maxMonth)) $month = $maxMonth;

        $start = $month->copy()->startOfMonth();
        $end   = $month->copy()->endOfMonth();

        $workingHours = $user->workingHours()->get()->keyBy('day_of_week');
        $appointments = $user->appointments()
            ->where('status', '!=', 'cancelled')
            ->whereBetween('scheduled_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->get(['scheduled_at', 'duration']);

        $apptsByDate = $appointments->groupBy(fn($a) => $a->scheduled_at->format('Y-m-d'));
        $slotMinutes = 30;
        $now  = Carbon::now();
        $days = [];

        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $dateStr = $d->format('Y-m-d');
            if ($d->lt($today)) { $days[$dateStr] = ['status' => 'past', 'slots' => []]; continue; }

            $wh = $workingHours->get($d->dayOfWeek);
            if (! $wh || ! $wh->is_working) { $days[$dateStr] = ['status' => 'closed', 'slots' => []]; continue; }

            $busy    = $apptsByDate->get($dateStr, collect());
            $cursor  = Carbon::parse($dateStr . ' ' . $wh->start_time);
            $dayEnd  = Carbon::parse($dateStr . ' ' . $wh->end_time);
            $slots   = [];
            $hasFree = false;

            while ($cursor->lt($dayEnd)) {
                $slotEnd = $cursor->copy()->addMinutes($slotMinutes);
                $free = $cursor->gte($now) && ! $busy->contains(function ($a) use ($cursor, $slotEnd) {
                    $aStart = $a->scheduled_at;
                    $aEnd   = $aStart->copy()->addMinutes($a->duration);
                    return $cursor->lt($aEnd) && $slotEnd->gt($aStart);
                });
                if ($free) $hasFree = true;
                $slots[] = ['time' => $cursor->format('H:i'), 'free' => $free];
                $cursor->addMinutes($slotMinutes);
            }

            $days[$dateStr] = ['status' => $hasFree ? 'available' : 'full', 'slots' => $slots];
        }

        return response()->json([
            'enabled'      => true,
            'month'        => $month->format('Y-m'),
            'slot_minutes' => $slotMinutes,
            'days'         => $days,
        ]);
    }

    /** POST /api/studios/{slug}/book — submit booking request to a specific master. */
    public function submitRequest(Request $request, string $slug): JsonResponse
    {
        $studio = Studio::where('slug', $slug)->firstOrFail();

        $data = $request->validate([
            'master_id'        => 'required|integer',
            'client_name'      => 'required|string|max:255',
            'client_email'     => 'nullable|email|max:255',
            'client_phone'     => 'nullable|string|max:50',
            'client_instagram' => 'nullable|string|max:100',
            'service_id'       => 'nullable|exists:services,id',
            'preferred_date'   => 'nullable|date|after:today',
            'preferred_time'   => 'nullable|string|max:10',
            'message'          => 'nullable|string|max:2000',
        ]);

        $member = $studio->activeMembers()->where('user_id', $data['master_id'])->firstOrFail();
        $user   = $member->user;

        if ($user->profile && ! $user->profile->is_accepting_bookings) {
            return response()->json(['error' => 'Цей майстер наразі не приймає нові записи.'], 422);
        }

        if (! empty($data['service_id'])) {
            $user->services()->findOrFail($data['service_id']);
        }

        $bookingRequest = $user->bookingRequests()->create([
            'client_name'      => $data['client_name'],
            'client_email'     => $data['client_email'] ?? null,
            'client_phone'     => $data['client_phone'] ?? null,
            'client_instagram' => $data['client_instagram'] ?? null,
            'service_id'       => $data['service_id'] ?? null,
            'preferred_date'   => $data['preferred_date'] ?? null,
            'preferred_time'   => $data['preferred_time'] ?? null,
            'message'          => $data['message'] ?? null,
            'source'           => 'studio_page',
        ]);

        return response()->json([
            'message' => 'Заявку відправлено. Майстер зв\'яжеться з вами найближчим часом.',
            'id'      => $bookingRequest->id,
        ], 201);
    }

    private function formatMaster($user): array
    {
        $profile = $user->profile;
        $services = $user->services
            ->where('is_active', true)
            ->sortBy('sort_order')
            ->map(fn($s) => [
                'id'            => $s->id,
                'name'          => $s->name,
                'price_display' => $s->price_display,
                'duration_display' => $s->duration_display,
                'color'         => $s->color,
            ])->values();

        $portfolio = $user->portfolioItems
            ->sortByDesc('is_featured')
            ->take(6)
            ->map(fn($p) => ['id' => $p->id, 'image_url' => $p->image_url, 'title' => $p->title])
            ->values();

        return [
            'id'                    => $user->id,
            'name'                  => $user->name,
            'slug'                  => $profile?->slug,
            'specialty'             => $profile?->specialty,
            'avatar_url'            => $profile?->avatar_url,
            'bio'                   => $profile?->bio,
            'city'                  => $profile?->city,
            'is_accepting_bookings' => $profile?->is_accepting_bookings ?? false,
            'show_availability'     => $profile?->show_availability ?? false,
            'services'              => $services,
            'portfolio'             => $portfolio,
        ];
    }
}
