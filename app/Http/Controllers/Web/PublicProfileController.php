<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\MasterProfile;
use Illuminate\View\View;

class PublicProfileController extends Controller
{
    public function show(string $slug): View
    {
        $profile = MasterProfile::where('slug', $slug)
            ->where('is_public', true)
            ->firstOrFail();

        $master = $profile->user;
        $services = $master->services()->where('is_active', true)->orderBy('sort_order')->get();
        $portfolio = $master->portfolioItems()->orderBy('sort_order')->orderByDesc('created_at')->get();

        $servicesJson = $services->map(function ($s) {
            return ['id' => $s->id, 'name' => $s->name];
        })->values()->toJson();

        $theme = $profile->theme ?: 'default';
        $corners = $profile->pub_corners ?: 'smooth';

        return view('public.master', compact('profile', 'master', 'services', 'portfolio', 'servicesJson', 'theme', 'corners'));
    }
}
