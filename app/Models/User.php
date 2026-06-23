<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Studio;
use App\Models\StudioMember;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name', 'email', 'password', 'role',
        'plan', 'subscription_status', 'subscription_ends_at', 'is_active',
        'onboarding_completed_at',
    ];
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'subscription_ends_at' => 'datetime',
            'is_active' => 'boolean',
            'onboarding_completed_at' => 'datetime',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(MasterProfile::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function workingHours(): HasMany
    {
        return $this->hasMany(WorkingHour::class);
    }

    public function scheduleBlocks(): HasMany
    {
        return $this->hasMany(ScheduleBlock::class);
    }

    public function bookingRequests(): HasMany
    {
        return $this->hasMany(BookingRequest::class);
    }

    public function portfolioItems(): HasMany
    {
        return $this->hasMany(PortfolioItem::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(\App\Models\Expense::class);
    }

    public function ownedStudio(): HasOne
    {
        return $this->hasOne(Studio::class, 'owner_id');
    }

    public function studioMembership(): HasOne
    {
        return $this->hasOne(StudioMember::class)->where('status', 'active');
    }

    public function isMaster(): bool
    {
        return $this->role === 'master';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
