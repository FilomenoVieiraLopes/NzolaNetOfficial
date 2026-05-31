<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    // HasApiTokens autentica a API; Notifiable permite enviar reset de senha.
    use HasApiTokens, HasFactory, Notifiable;

    // IDs numericos auto-incrementais.
    protected $keyType = 'int';
    public $incrementing = true;

    // Campos que podem ser preenchidos em massa.
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar_url',
        'cover_url',
        'bio',
        'privacy',
        'role',
    ];

    // Campos escondidos quando o model vira JSON.
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        // Laravel converte estes campos ao ler/escrever.
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    public function posts(): HasMany
    {
        // Publicacoes criadas pelo utilizador.
        return $this->hasMany(Post::class);
    }

    public function comments(): HasMany
    {
        // Comentarios escritos pelo utilizador.
        return $this->hasMany(Comment::class);
    }

    public function bazes(): HasMany
    {
        // Bazes dados pelo utilizador.
        return $this->hasMany(Baze::class);
    }

    public function following(): HasMany
    {
        // Perfis que este utilizador segue.
        return $this->hasMany(Follow::class, 'follower_id');
    }

    public function followers(): HasMany
    {
        // Perfis que seguem este utilizador.
        return $this->hasMany(Follow::class, 'following_id');
    }

    public function notifications(): HasMany
    {
        // Notificacoes recebidas pelo utilizador.
        return $this->hasMany(Notification::class);
    }

    public function isAdmin(): bool
    {
        // Centraliza a verificacao de permissao administrativa.
        return $this->role === 'admin';
    }
}
