<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\URL;
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

    public function sendPasswordResetNotification($token): void
    {
        $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://127.0.0.1:4200'), '/');
        $resetUrl = URL::query($frontendUrl . '/resetar-senha', [
            'token' => $token,
            'email' => $this->email,
        ]);

        $this->notify(new class($resetUrl) extends \Illuminate\Notifications\Notification {
            public function __construct(private readonly string $resetUrl) {}

            public function via(object $notifiable): array
            {
                return ['mail'];
            }

            public function toMail(object $notifiable): MailMessage
            {
                return (new MailMessage)
                    ->subject('Recuperacao de senha - NzolaNet')
                    ->greeting('Ola!')
                    ->line('Recebemos um pedido para redefinir a senha da sua conta NzolaNet.')
                    ->action('Definir nova senha', $this->resetUrl)
                    ->line('Se nao fez este pedido, ignore este email.');
            }
        });
    }
}
