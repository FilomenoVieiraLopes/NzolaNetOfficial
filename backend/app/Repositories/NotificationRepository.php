<?php

namespace App\Repositories;

use App\Interfaces\Repositories\INotificationRepository;
use App\Models\Notification;
use Illuminate\Database\Eloquent\Collection;

class NotificationRepository implements INotificationRepository
{
    public function create(string $userId, string $type, string $relatedId): Notification
    {
        // related_id aponta para o recurso que causou a notificacao.
        return Notification::create([
            'user_id'    => $userId,
            'type'       => $type,
            'related_id' => $relatedId,
        ]);
    }

    public function getByUser(string $userId): Collection
    {
        // Notificacoes recentes primeiro.
        return Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function markAsRead(string $id, string $userId): bool
    {
        // Busca por id e user_id para impedir acesso a notificacoes de terceiros.
        $notification = Notification::where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$notification) {
            throw new \Exception('Notificacao nao encontrada.', 404);
        }

        return $notification->update(['read' => true]);
    }

    public function markAllAsRead(string $userId): bool
    {
        // Atualiza apenas notificacoes ainda nao lidas do utilizador.
        return Notification::where('user_id', $userId)
            ->where('read', false)
            ->update(['read' => true]);
    }
}
