<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAnalysis extends Model
{
    protected $fillable = [
        'user_id', 'period',
        'highlights', 'suggestions',
        'generated_at', 'generation_type',
    ];

    protected function casts(): array
    {
        return [
            'highlights'   => 'array',
            'suggestions'  => 'array',
            'generated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
