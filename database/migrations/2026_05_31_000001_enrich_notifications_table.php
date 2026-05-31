<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('actor_id')->nullable()->after('related_id')->constrained('users')->nullOnDelete();
            $table->foreignId('post_id')->nullable()->after('actor_id')->constrained('posts')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropConstrainedForeignId('post_id');
            $table->dropConstrainedForeignId('actor_id');
        });
    }
};
