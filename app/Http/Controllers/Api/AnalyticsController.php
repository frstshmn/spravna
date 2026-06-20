<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $from = $request->filled('from') ? Carbon::parse($request->from)->startOfDay() : Carbon::now()->startOfMonth();
        $to   = $request->filled('to')   ? Carbon::parse($request->to)->endOfDay()     : Carbon::now()->endOfMonth();

        $appts = $user->appointments()
            ->with(['service', 'client'])
            ->whereBetween('scheduled_at', [$from, $to])
            ->get();

        $completed  = $appts->where('status', 'completed');
        $totalRevenue   = $completed->sum('price');
        $totalSessions  = $appts->count();
        $avgValue       = $completed->count() > 0 ? $totalRevenue / $completed->count() : 0;

        // Client retention: clients that had appointments before this period
        $clientIds = $appts->pluck('client_id')->filter()->unique()->values();
        $returningCount = 0;
        foreach ($clientIds as $cid) {
            if ($user->appointments()->where('client_id', $cid)->where('scheduled_at', '<', $from)->exists()) {
                $returningCount++;
            }
        }
        $newCount = $clientIds->count() - $returningCount;

        // Completion breakdown
        $completion = [
            'completed' => $appts->where('status', 'completed')->count(),
            'cancelled'  => $appts->where('status', 'cancelled')->count(),
            'no_show'    => $appts->where('status', 'no_show')->count(),
            'pending'    => $appts->whereIn('status', ['pending', 'confirmed'])->count(),
        ];

        // Top services
        $topServices = $appts->where('status', 'completed')
            ->whereNotNull('service_id')
            ->groupBy('service_id')
            ->map(fn($g) => [
                'name'    => $g->first()->service?->name ?? '—',
                'count'   => $g->count(),
                'revenue' => (float) $g->sum('price'),
            ])
            ->sortByDesc('revenue')
            ->values()
            ->take(6);

        // Top clients by revenue
        $topClients = $appts->where('status', 'completed')
            ->whereNotNull('client_id')
            ->groupBy('client_id')
            ->map(fn($g) => [
                'name'    => $g->first()->client?->name ?? '—',
                'count'   => $g->count(),
                'revenue' => (float) $g->sum('price'),
            ])
            ->sortByDesc('revenue')
            ->values()
            ->take(5);

        // Busiest hour/day slots (heatmap data)
        $busiest = [];
        foreach ($appts as $a) {
            $dt  = Carbon::parse($a->scheduled_at);
            $day = $dt->dayOfWeekIso; // 1=Mon … 7=Sun
            $hr  = $dt->hour;
            $key = "$day-$hr";
            $busiest[$key] = ($busiest[$key] ?? 0) + 1;
        }
        $busiestArr = [];
        foreach ($busiest as $k => $cnt) {
            [$day, $hr] = explode('-', $k);
            $busiestArr[] = ['day' => (int)$day, 'hour' => (int)$hr, 'count' => $cnt];
        }

        // Revenue by month (for range ≤ 12 months) or by week (≤ 2 months)
        $diffMonths = $from->diffInMonths($to);
        $revenueChart = [];
        if ($diffMonths <= 2) {
            // by week
            $cursor = $from->copy()->startOfWeek();
            while ($cursor <= $to) {
                $weekEnd = $cursor->copy()->endOfWeek();
                $slice = $appts->where('status', 'completed')
                    ->filter(fn($a) => Carbon::parse($a->scheduled_at)->between($cursor, $weekEnd));
                $revenueChart[] = [
                    'label'    => $cursor->format('d M'),
                    'revenue'  => (float) $slice->sum('price'),
                    'sessions' => $slice->count(),
                ];
                $cursor->addWeek();
            }
        } else {
            // by month
            $cursor = $from->copy()->startOfMonth();
            while ($cursor <= $to) {
                $monthEnd = $cursor->copy()->endOfMonth();
                $slice = $appts->where('status', 'completed')
                    ->filter(fn($a) => Carbon::parse($a->scheduled_at)->between($cursor, $monthEnd));
                $revenueChart[] = [
                    'label'    => $cursor->locale('uk')->monthName . ' ' . $cursor->year,
                    'revenue'  => (float) $slice->sum('price'),
                    'sessions' => $slice->count(),
                ];
                $cursor->addMonth();
            }
        }

        // Expenses in range
        $expenses = $user->expenses()->whereBetween('date', [$from->toDateString(), $to->toDateString()])->get();
        $totalExpenses = $expenses->sum('amount');
        $expensesByCategory = $expenses->groupBy('category')
            ->map(fn($g) => ['category' => $g->first()->category, 'total' => (float) $g->sum('amount')])
            ->values();

        // Expenses bucketed into the same time periods as revenue_chart
        $expensesChart = [];
        if ($diffMonths <= 2) {
            $expCursor = $from->copy()->startOfWeek();
            while ($expCursor <= $to) {
                $expWeekEnd = $expCursor->copy()->endOfWeek();
                $slice = $expenses->filter(fn($e) => $e->date->between($expCursor, $expWeekEnd));
                $expensesChart[] = ['label' => $expCursor->format('d M'), 'total' => (float) $slice->sum('amount')];
                $expCursor->addWeek();
            }
        } else {
            $expCursor = $from->copy()->startOfMonth();
            while ($expCursor <= $to) {
                $expMonthEnd = $expCursor->copy()->endOfMonth();
                $slice = $expenses->filter(fn($e) => $e->date->between($expCursor, $expMonthEnd));
                $expensesChart[] = ['label' => $expCursor->locale('uk')->monthName . ' ' . $expCursor->year, 'total' => (float) $slice->sum('amount')];
                $expCursor->addMonth();
            }
        }

        return response()->json([
            'summary' => [
                'total_revenue'     => (float) $totalRevenue,
                'total_sessions'    => $totalSessions,
                'avg_session_value' => round($avgValue, 2),
                'new_clients'       => $newCount,
                'returning_clients' => $returningCount,
                'total_expenses'    => (float) $totalExpenses,
                'profit'            => (float) ($totalRevenue - $totalExpenses),
            ],
            'revenue_chart'        => $revenueChart,
            'expenses_chart'       => $expensesChart,
            'completion_rate'      => $completion,
            'top_services'         => $topServices,
            'top_clients'          => $topClients,
            'busiest_slots'        => $busiestArr,
            'client_retention'     => ['new' => $newCount, 'returning' => $returningCount],
            'expenses_by_category' => $expensesByCategory,
        ]);
    }
}
