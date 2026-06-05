<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Comment extends Model
{
    use HasFactory;

    // Comentario pertence a um post e a um utilizador.
    protected $fillable = [
        'post_id',
        'user_id',
        'body',
    ];

    public function post(): BelongsTo
    {
        // Publicacao comentada.
        return $this->belongsTo(Post::class);
    }

    public function user(): BelongsTo
    {
        // Autor do comentario.
        return $this->belongsTo(User::class);
    }

    public function bazes(): HasMany
    {
        return $this->hasMany(CommentBaze::class);
    }
}
