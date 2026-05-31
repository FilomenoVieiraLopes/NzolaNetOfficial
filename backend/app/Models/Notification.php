<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    // A tabela tem created_at, mas nao tem updated_at.
    public const UPDATED_AT = null;

    // type define o evento; related_id aponta para o recurso relacionado.
    protected $fillable = [
        'user_id',
        'type',
        'related_id',
        'read',
    ];

    protected $casts = [
        // Garante tipos corretos ao montar as respostas.
        'read' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        // Utilizador que recebeu a notificacao.
        return $this->belongsTo(User::class);
    }
}
