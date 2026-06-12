<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $fillable = [
        'user_id', 'name', 'email', 'phone', 'birthday',
        'notes', 'medical_notes', 'instagram', 'source',
        'avatar_url', 'is_vip', 'is_blocked',
    ];

    protected function casts(): array
    {
        return [
            'birthday' => 'date',
            'is_vip' => 'boolean',
            'is_blocked' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function getTotalSpentAttribute(): float
    {
        return $this->appointments()
            ->where('status', 'completed')
            ->sum('price') ?? 0;
    }

    public function getVisitsCountAttribute(): int
    {
        return $this->appointments()->where('status', 'completed')->count();
    }
}
