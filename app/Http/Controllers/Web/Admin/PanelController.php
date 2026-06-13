<?php

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use Illuminate\View\View;

class PanelController extends Controller
{
    public function index(): View
    {
        return view('admin.app');
    }
}
