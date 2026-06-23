<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('studio_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('studio_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email');
            $table->enum('role', ['owner', 'member'])->default('member');
            $table->enum('status', ['pending', 'active'])->default('pending');
            $table->string('invite_token')->nullable()->unique();
            $table->boolean('can_view_calendar')->default(true);
            $table->boolean('can_view_requests')->default(true);
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['studio_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('studio_members');
    }
};
