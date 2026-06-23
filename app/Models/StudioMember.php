<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudioMember extends Model
{
    protected $fillable = [
        'studio_id', 'user_id', 'email', 'role', 'status',
        'invite_token', 'can_view_calendar', 'can_view_requests',
        'invited_at', 'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'can_view_calendar' => 'boolean',
            'can_view_requests' => 'boolean',
            'invited_at'        => 'datetime',
            'joined_at'         => 'datetime',
        ];
    }

    public function studio(): BelongsTo
    {
        return $this->belongsTo(Studio::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }
}
