<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Follow extends Model
{
    use HasFactory;

    // A tabela guarda created_at manualmente e nao usa updated_at.
    public $timestamps = false;

    // follower_id segue following_id.
    protected $fillable = [
        'follower_id',
        'following_id',
    ];

    public function follower(): BelongsTo
    {
        // Quem segue.
        return $this->belongsTo(User::class, 'follower_id');
    }

    public function following(): BelongsTo
    {
        // Quem e seguido.
        return $this->belongsTo(User::class, 'following_id');
    }
}
