<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WorkingHour;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::withCount(['clients', 'appointments'])->with('profile');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->get('role')) {
            $query->where('role', $role);
        }

        if ($plan = $request->get('plan')) {
            $query->where('plan', $plan);
        }

        if ($status = $request->get('subscription_status')) {
            $query->where('subscription_status', $status);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $users = $query->latest()->paginate($request->get('per_page', 20));

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'                 => 'required|string|max:255',
            'email'                => 'required|email|unique:users',
            'password'             => 'required|string|min:8',
            'role'                 => 'required|in:master,admin',
            'specialty'            => 'nullable|string|max:100',
            'plan'                 => 'nullable|string|max:50',
            'subscription_status'  => 'nullable|string|max:50',
            'subscription_ends_at' => 'nullable|date',
            'is_active'            => 'nullable|boolean',
        ]);

        $user = User::create([
            'name'                 => $data['name'],
            'email'                => $data['email'],
            'password'             => $data['password'],
            'role'                 => $data['role'],
            'plan'                 => $data['plan'] ?? 'free',
            'subscription_status'  => $data['subscription_status'] ?? 'active',
            'subscription_ends_at' => $data['subscription_ends_at'] ?? null,
            'is_active'            => $data['is_active'] ?? true,
        ]);

        if ($user->role === 'master') {
            $user->profile()->create([
                'slug'      => Str::slug($data['name']) . '-' . $user->id,
                'specialty' => $data['specialty'] ?? null,
            ]);

            for ($day = 0; $day <= 6; $day++) {
                WorkingHour::create([
                    'user_id'     => $user->id,
                    'day_of_week' => $day,
                    'start_time'  => '09:00',
                    'end_time'    => '18:00',
                    'is_working'  => $day >= 1 && $day <= 5,
                ]);
            }
        }

        return response()->json($user->load('profile'), 201);
    }

    public function show(User $user): JsonResponse
    {
        $stats = [
            'clients_count'          => $user->clients()->count(),
            'services_count'         => $user->services()->count(),
            'appointments_count'     => $user->appointments()->count(),
            'appointments_by_status' => $user->appointments()
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
            'total_revenue' => (float) $user->appointments()->where('status', 'completed')->sum('price'),
        ];

        $upcoming = $user->appointments()
            ->with(['client', 'service'])
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at')
            ->limit(10)
            ->get();

        $recent = $user->appointments()
            ->with(['client', 'service'])
            ->where('scheduled_at', '<', now())
            ->orderByDesc('scheduled_at')
            ->limit(10)
            ->get();

        return response()->json([
            'user'                  => $user->load('profile'),
            'stats'                 => $stats,
            'upcoming_appointments' => $upcoming,
            'recent_appointments'   => $recent,
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'                 => 'sometimes|string|max:255',
            'email'                => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password'             => 'nullable|string|min:8',
            'role'                 => 'sometimes|in:master,admin',
            'plan'                 => 'sometimes|string|max:50',
            'subscription_status'  => 'sometimes|string|max:50',
            'subscription_ends_at' => 'nullable|date',
            'is_active'            => 'sometimes|boolean',
        ]);

        if ($user->id === $request->user()->id) {
            if (array_key_exists('is_active', $data) && !$data['is_active']) {
                return response()->json(['message' => 'Не можна призупинити власний акаунт.'], 422);
            }
            if (array_key_exists('role', $data) && $data['role'] !== 'admin') {
                return response()->json(['message' => 'Не можна змінити роль власного акаунту.'], 422);
            }
        }

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json($user->load('profile'));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Не можна видалити власний акаунт.'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Користувача видалено']);
    }

    public function loginAs(User $user): JsonResponse
    {
        if ($user->role !== 'master') {
            return response()->json(['message' => 'Можна увійти лише в акаунт майстра.'], 422);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Акаунт призупинено.'], 422);
        }

        $token = $user->createToken('admin-login-as')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user->load('profile')]);
    }
}
