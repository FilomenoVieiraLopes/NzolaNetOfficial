<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Baze extends Model
{
    use HasFactory;

    // A tabela tem created_at, mas nao tem updated_at.
    public const UPDATED_AT = null;

    // Um baze liga um utilizador a uma publicacao.
    protected $fillable = [
        'post_id',
        'user_id',
    ];

    protected $casts = [
        // Permite formatar created_at como data no DTO.
        'created_at' => 'datetime',
    ];

    public function post(): BelongsTo
    {
        // Publicacao que recebeu o baze.
        return $this->belongsTo(Post::class);
    }

    public function user(): BelongsTo
    {
        // Utilizador que deu o baze.
        return $this->belongsTo(User::class);
    }
}
