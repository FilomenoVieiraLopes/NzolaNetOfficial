<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('notifications', 'actor_id')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->foreignId('actor_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('notifications', 'post_id')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->foreignId('post_id')->nullable()->after('related_id')->constrained('posts')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('notifications', 'post_id')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropConstrainedForeignId('post_id');
            });
        }

        if (Schema::hasColumn('notifications', 'actor_id')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropConstrainedForeignId('actor_id');
            });
        }
    }
};
