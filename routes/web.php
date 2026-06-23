<?php

use App\Http\Controllers\Web\Admin\AuthWebController as AdminAuthWebController;
use App\Http\Controllers\Web\Admin\PanelController as AdminPanelController;
use App\Http\Controllers\Web\AuthWebController;
use App\Http\Controllers\Web\DashboardWebController;
use App\Http\Controllers\Web\DeployController;
use App\Http\Controllers\Web\PublicProfileController;
use App\Http\Controllers\Web\PublicStudioWebController;
use App\Http\Controllers\Web\InvitationWebController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AuthWebController::class, 'landing'])->name('landing');
Route::get('/login', [AuthWebController::class, 'showLogin'])->name('login')->middleware('guest');
Route::get('/register', [AuthWebController::class, 'showRegister'])->name('register')->middleware('guest');
Route::post('/logout', [AuthWebController::class, 'logout'])->name('logout');

// Deploy hook — requires ?key={DEPLOY_SECRET}
Route::get('/deploy', [DeployController::class, 'deploy'])->name('deploy');

// Public master page
Route::get('/master/{slug}', [PublicProfileController::class, 'show'])->name('master.public');

// Public studio page
Route::get('/studio/{slug}', [PublicStudioWebController::class, 'show'])->name('studio.public');

// Studio invitation acceptance
Route::get('/join/{token}', [InvitationWebController::class, 'show'])->name('studio.invitation');

// Admin
Route::get('/admin/login', [AdminAuthWebController::class, 'showLogin'])->name('admin.login');
Route::get('/admin/{any?}', [AdminPanelController::class, 'index'])
    ->where('any', '.*')
    ->name('admin.app');

// SPA — token-guarded in JS
Route::get('/app/{any?}', [DashboardWebController::class, 'index'])
    ->where('any', '.*')
    ->name('app');
