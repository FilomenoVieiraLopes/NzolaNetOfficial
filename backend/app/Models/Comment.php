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
        'parent_id',
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

    public function parent(): BelongsTo
    {
        // Comentario principal ao qual esta resposta pertence.
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        // Respostas diretas deste comentario.
        return $this->hasMany(Comment::class, 'parent_id');
    }
}
