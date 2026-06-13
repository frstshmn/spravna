<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    protected $fillable = [
        'user_id', 'client_id', 'service_id', 'type', 'title',
        'scheduled_at', 'duration', 'status', 'price',
        'deposit', 'deposit_paid', 'notes', 'internal_notes', 'color',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'price' => 'decimal:2',
            'deposit' => 'decimal:2',
            'deposit_paid' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function getEndsAtAttribute(): \Carbon\Carbon
    {
        return $this->scheduled_at->addMinutes($this->duration);
    }

    public function getTitleDisplayAttribute(): string
    {
        if ($this->title) {
            return $this->title;
        }
        if ($this->type === 'block') {
            return 'Перерва';
        }
        return $this->service?->name ?? 'Запис';
    }

    public static function statusColor(string $status): string
    {
        return match($status) {
            'pending'     => '#f59e0b',
            'confirmed'   => '#3b82f6',
            'in_progress' => '#8b5cf6',
            'completed'   => '#10b981',
            'cancelled'   => '#ef4444',
            'no_show'     => '#6b7280',
            default       => '#6b7280',
        };
    }
}
