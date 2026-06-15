<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // O sistema ja usa tipos como follow_request e follow_accepted.
        // VARCHAR evita que novas notificacoes quebrem por causa do enum antigo.
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE notifications MODIFY type VARCHAR(50) NOT NULL');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE notifications MODIFY type ENUM('baze', 'comment', 'follow') NOT NULL");
        }
    }
};
