<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('master_profiles', function (Blueprint $table) {
            $table->boolean('show_availability')->default(true)->after('is_accepting_bookings');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('master_profiles', function (Blueprint $table) {
            $table->dropColumn('show_availability');
        });
    }
};
