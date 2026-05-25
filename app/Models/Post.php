<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    use HasFactory;

    // Campos gravados quando uma publicacao e criada ou atualizada.
    protected $fillable = [
        'user_id',
        'content',
        'image_url',
        'video_url',
    ];

    public function user(): BelongsTo
    {
        // Autor da publicacao.
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        // Comentarios associados a publicacao.
        return $this->hasMany(Comment::class);
    }

    public function bazes(): HasMany
    {
        // Reacoes recebidas pela publicacao.
        return $this->hasMany(Baze::class);
    }
}
