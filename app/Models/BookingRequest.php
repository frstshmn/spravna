<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingRequest extends Model
{
    protected $fillable = [
        'user_id', 'service_id', 'appointment_id',
        'client_name', 'client_email', 'client_phone', 'client_instagram',
        'preferred_date', 'preferred_time', 'message',
        'status', 'response_message', 'responded_at', 'source',
    ];

    protected function casts(): array
    {
        return [
            'preferred_date' => 'date',
            'responded_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
