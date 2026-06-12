<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $fillable = [
        'user_id', 'name', 'description', 'category',
        'price', 'price_from', 'price_to', 'price_on_request',
        'duration', 'color', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'price_from' => 'decimal:2',
            'price_to' => 'decimal:2',
            'price_on_request' => 'boolean',
            'is_active' => 'boolean',
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

    public function getPriceDisplayAttribute(): string
    {
        if ($this->price_on_request) return 'За запитом';
        if ($this->price) return number_format($this->price, 0);
        if ($this->price_from && $this->price_to) {
            return number_format($this->price_from, 0) . ' – ' . number_format($this->price_to, 0);
        }
        if ($this->price_from) return 'від ' . number_format($this->price_from, 0);
        return '—';
    }

    public function getDurationDisplayAttribute(): string
    {
        $hours = intdiv($this->duration, 60);
        $mins = $this->duration % 60;
        if ($hours && $mins) return "{$hours}г {$mins}хв";
        if ($hours) return "{$hours}г";
        return "{$mins}хв";
    }
}
