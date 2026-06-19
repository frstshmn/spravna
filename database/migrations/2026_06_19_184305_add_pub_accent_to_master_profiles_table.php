<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('master_profiles', function (Blueprint $table) {
            $table->string('pub_accent', 7)->nullable()->default(null)->after('pub_corners');
        });

        // Migrate old specific theme names → new light/dark + accent model
        DB::table('master_profiles')->where('theme', 'warm')  ->update(['theme' => 'light', 'pub_accent' => '#c4632a']);
        DB::table('master_profiles')->where('theme', 'ocean') ->update(['theme' => 'light', 'pub_accent' => '#0891b2']);
        DB::table('master_profiles')->where('theme', 'sakura')->update(['theme' => 'light', 'pub_accent' => '#db2777']);
        DB::table('master_profiles')->where('theme', 'mint')  ->update(['theme' => 'light', 'pub_accent' => '#059669']);
        DB::table('master_profiles')->where('theme', 'glass') ->update(['theme' => 'dark',  'pub_accent' => '#a855f7']);
        DB::table('master_profiles')->where('theme', 'copper')->update(['theme' => 'dark',  'pub_accent' => '#d97706']);
        // existing 'dark' (Noir) gets green accent
        DB::table('master_profiles')->where('theme', 'dark')->whereNull('pub_accent')->update(['pub_accent' => '#22c55e']);
    }

    public function down(): void
    {
        Schema::table('master_profiles', function (Blueprint $table) {
            $table->dropColumn('pub_accent');
        });
    }
};
