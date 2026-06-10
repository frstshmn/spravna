<?php

use App\Http\Controllers\Web\AuthWebController;
use App\Http\Controllers\Web\DashboardWebController;
use App\Http\Controllers\Web\PublicProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AuthWebController::class, 'landing'])->name('landing');
Route::get('/login', [AuthWebController::class, 'showLogin'])->name('login')->middleware('guest');
Route::post('/logout', [AuthWebController::class, 'logout'])->name('logout');

// Public master page
Route::get('/master/{slug}', [PublicProfileController::class, 'show'])->name('master.public');

// SPA — token-guarded in JS
Route::get('/app/{any?}', [DashboardWebController::class, 'index'])
    ->where('any', '.*')
    ->name('app');
