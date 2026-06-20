<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = $request->user()->expenses()->orderByDesc('date');

        if ($request->filled('from'))     $q->where('date', '>=', $request->from);
        if ($request->filled('to'))       $q->where('date', '<=', $request->to);
        if ($request->filled('category')) $q->where('category', $request->category);
        if ($request->filled('type'))     $q->where('type', $request->type);

        return response()->json($q->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'        => 'nullable|in:expense,income',
            'amount'      => 'required|numeric|min:0',
            'category'    => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
            'date'        => 'required|date',
        ]);

        $data['type'] = $data['type'] ?? 'expense';
        $expense = $request->user()->expenses()->create($data);

        return response()->json($expense, 201);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        abort_unless($expense->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'type'        => 'nullable|in:expense,income',
            'amount'      => 'sometimes|numeric|min:0',
            'category'    => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
            'date'        => 'sometimes|date',
        ]);

        $expense->update($data);

        return response()->json($expense);
    }

    public function destroy(Request $request, Expense $expense): JsonResponse
    {
        abort_unless($expense->user_id === $request->user()->id, 403);
        $expense->delete();
        return response()->json(null, 204);
    }

    public function income(Request $request): JsonResponse
    {
        $q = $request->user()->appointments()
            ->with(['client', 'service'])
            ->where('status', 'completed')
            ->whereNotNull('price')
            ->where('price', '>', 0)
            ->orderByDesc('scheduled_at');

        if ($request->filled('from')) $q->where('scheduled_at', '>=', $request->from);
        if ($request->filled('to'))   $q->where('scheduled_at', '<=', Carbon::parse($request->to)->endOfDay());

        return response()->json($q->limit(100)->get());
    }
}
