<?php

use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\ClientAnalysisController;
use App\Http\Controllers\Api\UserAnalysisController;
use App\Http\Controllers\Api\StudioController;
use App\Http\Controllers\Api\StudioInvitationController;
use App\Http\Controllers\Api\PublicStudioController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\BookingRequestController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Support\Facades\Route;

// ─── Public routes (no auth) ─────────────────────────────────────────────────

Route::get('/masters/{slug}', [PublicController::class, 'masterProfile']);
Route::get('/masters/{slug}/availability', [PublicController::class, 'availability']);
Route::post('/masters/{slug}/book', [PublicController::class, 'submitRequest']);

// Public studio routes
Route::get('/studios/{slug}', [PublicStudioController::class, 'show']);
Route::get('/studios/{slug}/masters/{masterId}/availability', [PublicStudioController::class, 'masterAvailability']);
Route::post('/studios/{slug}/book', [PublicStudioController::class, 'submitRequest']);

// Studio invitations (semi-public — accept requires auth via middleware below)
Route::get('/studio/invitations/{token}', [StudioInvitationController::class, 'show']);
Route::post('/studio/invitations/{token}/decline', [StudioInvitationController::class, 'decline']);

// ─── Auth ────────────────────────────────────────────────────────────────────

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// ─── Authenticated routes ─────────────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout',          [AuthController::class, 'logout']);
    Route::get('/auth/me',               [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Profile
    Route::get('/profile',           [ProfileController::class, 'show']);
    Route::put('/profile',           [ProfileController::class, 'update']);
    Route::post('/profile/avatar',   [ProfileController::class, 'uploadAvatar']);
    Route::post('/onboarding/complete', [ProfileController::class, 'completeOnboarding']);

    // Services
    Route::apiResource('services', ServiceController::class);

    // Clients
    Route::apiResource('clients', ClientController::class);

    // Appointments
    Route::get('/appointments/archive', [AppointmentController::class, 'archive']);
    Route::apiResource('appointments', AppointmentController::class);

    // Schedule
    Route::get('/schedule/working-hours',        [ScheduleController::class, 'getWorkingHours']);
    Route::put('/schedule/working-hours',        [ScheduleController::class, 'updateWorkingHours']);
    Route::get('/schedule/blocks',               [ScheduleController::class, 'getBlocks']);
    Route::post('/schedule/blocks',              [ScheduleController::class, 'storeBlock']);
    Route::delete('/schedule/blocks/{block}',    [ScheduleController::class, 'destroyBlock']);

    // Booking requests
    Route::get('/booking-requests',                          [BookingRequestController::class, 'index']);
    Route::get('/booking-requests/{bookingRequest}',         [BookingRequestController::class, 'show']);
    Route::post('/booking-requests/{bookingRequest}/respond',[BookingRequestController::class, 'respond']);
    Route::delete('/booking-requests/{bookingRequest}',      [BookingRequestController::class, 'destroy']);

    // Finances
    Route::apiResource('expenses', ExpenseController::class)->except(['show']);
    Route::get('/finances/income', [ExpenseController::class, 'income']);

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index']);

    // AI client analysis
    Route::get('/analysis/{clientId}',         [ClientAnalysisController::class, 'show']);
    Route::post('/analysis/{clientId}/refresh', [ClientAnalysisController::class, 'refresh']);

    // AI user (business) analysis
    Route::get('/user-analysis',               [UserAnalysisController::class, 'show']);
    Route::post('/user-analysis/generate',     [UserAnalysisController::class, 'generate']);

    // Portfolio
    Route::get('/portfolio',            [PortfolioController::class, 'index']);
    Route::post('/portfolio',           [PortfolioController::class, 'store']);
    Route::delete('/portfolio/{portfolioItem}', [PortfolioController::class, 'destroy']);

    // Studio (multi-account)
    Route::get('/studio',                                    [StudioController::class, 'show']);
    Route::post('/studio',                                   [StudioController::class, 'store']);
    Route::put('/studio',                                    [StudioController::class, 'update']);
    Route::post('/studio/photo',                             [StudioController::class, 'uploadPhoto']);
    Route::post('/studio/invite',                            [StudioController::class, 'invite']);
    Route::delete('/studio/members/{userId}',                [StudioController::class, 'removeMember']);
    Route::put('/studio/members/{userId}',                   [StudioController::class, 'updateMember']);
    Route::get('/studio/members/{userId}/calendar',          [StudioController::class, 'memberCalendar']);
    Route::get('/studio/members/{userId}/requests',          [StudioController::class, 'memberRequests']);
    Route::post('/studio/invitations/{token}/accept',        [StudioInvitationController::class, 'accept']);

    // ─── Admin panel ────────────────────────────────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminDashboardController::class, 'index']);

        Route::get('/users',                  [AdminUserController::class, 'index']);
        Route::post('/users',                 [AdminUserController::class, 'store']);
        Route::get('/users/{user}',           [AdminUserController::class, 'show']);
        Route::put('/users/{user}',           [AdminUserController::class, 'update']);
        Route::delete('/users/{user}',        [AdminUserController::class, 'destroy']);
        Route::post('/users/{user}/login-as', [AdminUserController::class, 'loginAs']);
    });
});
