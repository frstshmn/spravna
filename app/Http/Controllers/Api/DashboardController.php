<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();
        $startOfLastMonth = Carbon::now()->subMonth()->startOfMonth();
        $endOfLastMonth = Carbon::now()->subMonth()->endOfMonth();

        // Today's appointments
        $todayAppointments = $user->appointments()
            ->with(['client', 'service'])
            ->whereDate('scheduled_at', $today)
            ->orderBy('scheduled_at')
            ->get();

        // This month revenue
        $monthRevenue = $user->appointments()
            ->where('status', 'completed')
            ->whereBetween('scheduled_at', [$startOfMonth, $endOfMonth])
            ->sum('price');

        // Last month revenue
        $lastMonthRevenue = $user->appointments()
            ->where('status', 'completed')
            ->whereBetween('scheduled_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('price');

        // This month sessions
        $monthSessions = $user->appointments()
            ->where('status', 'completed')
            ->whereBetween('scheduled_at', [$startOfMonth, $endOfMonth])
            ->count();

        // Pending requests
        $pendingRequests = $user->bookingRequests()
            ->where('status', 'pending')
            ->count();

        // Upcoming appointments (next 7 days)
        $upcomingAppointments = $user->appointments()
            ->with(['client', 'service'])
            ->whereBetween('scheduled_at', [Carbon::now(), Carbon::now()->addDays(7)])
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('scheduled_at')
            ->limit(10)
            ->get();

        // Recent booking requests
        $recentRequests = $user->bookingRequests()
            ->with('service')
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->get();

        // Revenue chart (last 6 months)
        $revenueChart = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $revenueChart[] = [
                'month' => $date->format('M Y'),
                'revenue' => $user->appointments()
                    ->where('status', 'completed')
                    ->whereYear('scheduled_at', $date->year)
                    ->whereMonth('scheduled_at', $date->month)
                    ->sum('price'),
                'sessions' => $user->appointments()
                    ->where('status', 'completed')
                    ->whereYear('scheduled_at', $date->year)
                    ->whereMonth('scheduled_at', $date->month)
                    ->count(),
            ];
        }

        // Top services this month
        $topServices = $user->appointments()
            ->with('service')
            ->where('status', 'completed')
            ->whereBetween('scheduled_at', [$startOfMonth, $endOfMonth])
            ->whereNotNull('service_id')
            ->selectRaw('service_id, count(*) as count, sum(price) as revenue')
            ->groupBy('service_id')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'today_appointments'   => $todayAppointments->count(),
                'month_revenue'        => (float) $monthRevenue,
                'last_month_revenue'   => (float) $lastMonthRevenue,
                'month_sessions'       => $monthSessions,
                'pending_requests'     => $pendingRequests,
                'total_clients'        => $user->clients()->count(),
                'revenue_change'       => $lastMonthRevenue > 0
                    ? round((($monthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
                    : null,
            ],
            'today_appointments'   => $todayAppointments,
            'upcoming_appointments' => $upcomingAppointments,
            'recent_requests'       => $recentRequests,
            'revenue_chart'         => $revenueChart,
            'top_services'          => $topServices,
        ]);
    }
}
