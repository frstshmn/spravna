<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MasterProfile extends Model
{
    protected $fillable = [
        'user_id', 'slug', 'bio', 'specialty', 'avatar', 'phone',
        'city', 'country', 'instagram', 'website', 'booking_notice',
        'cancellation_policy', 'is_public', 'is_accepting_bookings',
        'show_availability', 'currency', 'social_links',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'is_accepting_bookings' => 'boolean',
            'show_availability' => 'boolean',
            'social_links' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar) return null;
        return asset('storage/' . $this->avatar);
    }
}
