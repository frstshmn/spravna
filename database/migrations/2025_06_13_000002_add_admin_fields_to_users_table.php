<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('plan')->default('free')->after('role');
            $table->string('subscription_status')->default('active')->after('plan');
            $table->timestamp('subscription_ends_at')->nullable()->after('subscription_status');
            $table->boolean('is_active')->default(true)->after('subscription_ends_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['plan', 'subscription_status', 'subscription_ends_at', 'is_active']);
        });
    }
};
