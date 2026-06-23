<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\StudioMember;
use Illuminate\View\View;

class InvitationWebController extends Controller
{
    public function show(string $token): View
    {
        $member = StudioMember::where('invite_token', $token)
            ->where('status', 'pending')
            ->with('studio')
            ->first();

        return view('invitation', ['token' => $token, 'member' => $member]);
    }
}
