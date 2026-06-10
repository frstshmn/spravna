<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AuthWebController extends Controller
{
    public function landing(): View|RedirectResponse
    {
        // If the user has a token they'll be redirected client-side by the SPA
        return view('landing');
    }

    public function showLogin(): View
    {
        return view('auth.login');
    }

    public function showRegister(): View
    {
        return view('auth.register');
    }

    public function logout(Request $request): RedirectResponse
    {
        return redirect()->route('landing');
    }
}
