<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->text('bio')->nullable();
            $table->string('specialty')->nullable(); // tattoo, nails, brows, lashes, etc.
            $table->string('avatar')->nullable();
            $table->string('phone')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->string('instagram')->nullable();
            $table->string('website')->nullable();
            $table->string('booking_notice')->nullable(); // e.g. "Book 2 weeks in advance"
            $table->text('cancellation_policy')->nullable();
            $table->boolean('is_public')->default(true);
            $table->boolean('is_accepting_bookings')->default(true);
            $table->string('currency', 3)->default('USD');
            $table->json('social_links')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_profiles');
    }
};
