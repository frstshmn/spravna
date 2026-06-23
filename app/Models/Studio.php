<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Studio extends Model
{
    protected $fillable = ['owner_id', 'name', 'slug', 'description', 'photo'];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(StudioMember::class);
    }

    public function activeMembers(): HasMany
    {
        return $this->hasMany(StudioMember::class)->where('status', 'active');
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo ? '/storage/' . $this->photo : null;
    }
}
