<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $masters = User::where('role', 'master');

        $totalRevenue = Appointment::where('status', 'completed')->sum('price');

        // Registrations chart — last 6 months
        $registrations = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $registrations[] = [
                'month' => $date->format('M Y'),
                'count' => (clone $masters)
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
            ];
        }

        $planBreakdown = (clone $masters)
            ->selectRaw('plan, count(*) as count')
            ->groupBy('plan')
            ->pluck('count', 'plan');

        $statusBreakdown = (clone $masters)
            ->selectRaw('subscription_status, count(*) as count')
            ->groupBy('subscription_status')
            ->pluck('count', 'subscription_status');

        $expiringSoon = (clone $masters)
            ->whereNotNull('subscription_ends_at')
            ->whereBetween('subscription_ends_at', [Carbon::now(), Carbon::now()->addDays(14)])
            ->orderBy('subscription_ends_at')
            ->get(['id', 'name', 'email', 'plan', 'subscription_status', 'subscription_ends_at']);

        $recentUsers = (clone $masters)
            ->withCount(['clients', 'appointments'])
            ->latest()
            ->limit(5)
            ->get(['id', 'name', 'email', 'plan', 'subscription_status', 'is_active', 'created_at']);

        return response()->json([
            'stats' => [
                'total_masters'        => (clone $masters)->count(),
                'active_subscriptions' => (clone $masters)->where('subscription_status', 'active')->count(),
                'trialing'             => (clone $masters)->where('subscription_status', 'trialing')->count(),
                'suspended'            => (clone $masters)->where('is_active', false)->count(),
                'total_clients'        => Client::count(),
                'total_appointments'   => Appointment::count(),
                'appointments_today'   => Appointment::whereDate('scheduled_at', Carbon::today())->count(),
                'total_revenue'        => (float) $totalRevenue,
                'new_this_month'       => (clone $masters)
                    ->whereBetween('created_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
                    ->count(),
            ],
            'registrations_chart' => $registrations,
            'plan_breakdown'      => $planBreakdown,
            'status_breakdown'    => $statusBreakdown,
            'expiring_soon'       => $expiringSoon,
            'recent_users'        => $recentUsers,
        ]);
    }
}
