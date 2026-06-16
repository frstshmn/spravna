<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterProfile;
use App\Models\User;
use Carbon\Carbon;
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
                'show_availability'     => $profile->show_availability,
                'currency'              => $profile->currency,
                'social_links'          => $profile->social_links,
            ],
            'services'  => $services,
            'portfolio' => $portfolio,
        ]);
    }

    public function availability(Request $request, string $slug): JsonResponse
    {
        $profile = MasterProfile::where('slug', $slug)
            ->where('is_public', true)
            ->firstOrFail();

        if (!$profile->show_availability) {
            return response()->json(['enabled' => false]);
        }

        $user = $profile->user;

        $today = Carbon::today();
        $requested = $request->query('month');
        $month = $requested
            ? Carbon::createFromFormat('Y-m', $requested)->startOfMonth()
            : $today->copy()->startOfMonth();

        // Limit how far clients can browse: current month .. +2 months ahead.
        $minMonth = $today->copy()->startOfMonth();
        $maxMonth = $today->copy()->startOfMonth()->addMonths(2);
        if ($month->lt($minMonth)) $month = $minMonth;
        if ($month->gt($maxMonth)) $month = $maxMonth;

        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();

        $workingHours = $user->workingHours()->get()->keyBy('day_of_week');

        $appointments = $user->appointments()
            ->where('status', '!=', 'cancelled')
            ->whereBetween('scheduled_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->get(['scheduled_at', 'duration']);

        $apptsByDate = $appointments->groupBy(fn($a) => $a->scheduled_at->format('Y-m-d'));

        $slotMinutes = 30;
        $now = Carbon::now();
        $days = [];

        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $dateStr = $d->format('Y-m-d');

            if ($d->lt($today)) {
                $days[$dateStr] = ['status' => 'past', 'slots' => []];
                continue;
            }

            $wh = $workingHours->get($d->dayOfWeek);
            if (!$wh || !$wh->is_working) {
                $days[$dateStr] = ['status' => 'closed', 'slots' => []];
                continue;
            }

            $busy = $apptsByDate->get($dateStr, collect());
            $cursor = Carbon::parse($dateStr . ' ' . $wh->start_time);
            $dayEnd = Carbon::parse($dateStr . ' ' . $wh->end_time);
            $slots = [];
            $hasFree = false;

            while ($cursor->lt($dayEnd)) {
                $slotEnd = $cursor->copy()->addMinutes($slotMinutes);
                $free = $cursor->gte($now) && !$busy->contains(function ($a) use ($cursor, $slotEnd) {
                    $aStart = $a->scheduled_at;
                    $aEnd = $aStart->copy()->addMinutes($a->duration);
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
            'message' => 'Вашу заявку відправлено. Майстер зв\'яжеться з вами найближчим часом.',
            'id'      => $bookingRequest->id,
        ], 201);
    }
}
