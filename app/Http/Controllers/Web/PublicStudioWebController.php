<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Studio;
use Illuminate\View\View;

class PublicStudioWebController extends Controller
{
    public function show(string $slug): View
    {
        $studio = Studio::where('slug', $slug)->firstOrFail();
        return view('public.studio', compact('studio'));
    }
}
