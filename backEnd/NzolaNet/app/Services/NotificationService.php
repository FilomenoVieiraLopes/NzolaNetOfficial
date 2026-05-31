<?php

namespace App\Services;

use App\DTOs\Notification\NotificationResponseDTO;
use App\Interfaces\Repositories\INotificationRepository;
use App\Interfaces\Services\INotificationService;

class NotificationService implements INotificationService
{
    public function __construct(
        // Repositorio encapsula consultas e updates de notificacoes.
        private readonly INotificationRepository $notificationRepository,
    ) {}

    public function getForUser(string $userId): array
    {
        // A API nunca retorna notificacoes de outros utilizadores.
        $notifications = $this->notificationRepository->getByUser($userId);

        return $notifications->map(function ($notification) {
            return NotificationResponseDTO::fromModel($notification)->toArray();
        })->toArray();
    }

    public function markAsRead(string $id, string $userId): void
    {
        // userId e parte da busca para impedir alterar notificacoes alheias.
        $this->notificationRepository->markAsRead($id, $userId);
    }

    public function markAllAsRead(string $userId): void
    {
        // Atualizacao em massa limitada ao dono das notificacoes.
        $this->notificationRepository->markAllAsRead($userId);
    }
}
