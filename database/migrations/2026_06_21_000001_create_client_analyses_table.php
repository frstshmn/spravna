<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('period', 7);          // YYYY-MM
            $table->json('highlights');
            $table->json('suggestions');
            $table->timestamp('generated_at');
            $table->string('generation_type', 10)->default('auto'); // auto | manual
            $table->timestamps();

            $table->unique(['user_id', 'client_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_analyses');
    }
};
