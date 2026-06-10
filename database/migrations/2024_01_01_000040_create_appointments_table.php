<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // master
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title')->nullable(); // override or auto-fill from service
            $table->dateTime('scheduled_at');
            $table->integer('duration')->default(60); // minutes
            $table->enum('status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])->default('pending');
            $table->decimal('price', 10, 2)->nullable();
            $table->decimal('deposit', 10, 2)->nullable();
            $table->boolean('deposit_paid')->default(false);
            $table->text('notes')->nullable(); // visible to client
            $table->text('internal_notes')->nullable(); // master only
            $table->string('color', 7)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
