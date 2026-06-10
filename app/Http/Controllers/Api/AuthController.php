<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WorkingHour;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'specialty' => 'nullable|string|max:100',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
            'role'     => 'master',
        ]);

        // Create default profile
        $slug = \Str::slug($data['name']) . '-' . $user->id;
        $user->profile()->create([
            'slug'      => $slug,
            'specialty' => $data['specialty'] ?? null,
        ]);

        // Create default working hours (Mon–Sat 9–18)
        for ($day = 1; $day <= 6; $day++) {
            WorkingHour::create([
                'user_id'    => $user->id,
                'day_of_week' => $day,
                'start_time' => '09:00',
                'end_time'   => '18:00',
                'is_working' => $day <= 5, // Mon–Fri working by default
            ]);
        }
        WorkingHour::create([
            'user_id'    => $user->id,
            'day_of_week' => 0,
            'start_time' => '09:00',
            'end_time'   => '18:00',
            'is_working' => false,
        ]);

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'user'  => $user->load('profile'),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'user'  => $user->load('profile'),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('profile'));
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password'      => 'required',
            'password'              => 'required|min:6|confirmed',
        ]);

        if (!Hash::check($data['current_password'], $request->user()->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $request->user()->update(['password' => $data['password']]);
        $request->user()->tokens()->delete();
        $token = $request->user()->createToken('auth')->plainTextToken;

        return response()->json(['message' => 'Password changed', 'token' => $token]);
    }
}
