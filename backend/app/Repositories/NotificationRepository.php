<?php

namespace App\Repositories;

use App\Interfaces\Repositories\INotificationRepository;
use App\Models\Notification;
use Illuminate\Database\Eloquent\Collection;

class NotificationRepository implements INotificationRepository
{
    public function create(string $userId, string $type, string $relatedId, ?string $actorId = null, ?string $postId = null): Notification
    {
        // related_id aponta para o recurso que causou a notificacao.
        $notification = Notification::create([
            'user_id'    => $userId,
            'actor_id'   => $actorId,
            'type'       => $type,
            'related_id' => $relatedId,
            'post_id'    => $postId,
            'read'       => false,
        ]);

        return $notification;
    }

    public function createIfNotExists(string $userId, string $type, string $relatedId, ?string $actorId = null, ?string $postId = null): Notification
    {
        $notification = Notification::where('user_id', $userId)
            ->where('type', $type)
            ->where('related_id', $relatedId)
            ->when($actorId !== null, fn($query) => $query->where('actor_id', $actorId))
            ->when($postId !== null, fn($query) => $query->where('post_id', $postId))
            ->first();

        if ($notification) {
            return $notification;
        }

        return $this->create($userId, $type, $relatedId, $actorId, $postId);
    }

    public function getByUser(string $userId): Collection
    {
        // Notificacoes recentes primeiro.
        return Notification::where('user_id', $userId)
            ->with(['actor', 'post'])
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
            ->where(function ($query) {
                $query->where('read', false)
                    ->orWhereNull('read');
            })
            ->update(['read' => true]);
    }

    public function deleteByTypeAndActor(string $userId, string $type, string $actorId): int
    {
        return Notification::where('user_id', $userId)
            ->where('type', $type)
            ->where('actor_id', $actorId)
            ->delete();
    }

    public function delete(string $id, string $userId): bool
    {
        // A remocao tambem filtra por user_id para proteger notificacoes de terceiros.
        $notification = Notification::where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$notification) {
            throw new \Exception('Notificacao nao encontrada.', 404);
        }

        return (bool) $notification->delete();
    }
}
