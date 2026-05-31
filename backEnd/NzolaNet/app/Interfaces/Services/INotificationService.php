<?php

namespace App\Interfaces\Services;

use App\DTOs\Notification\NotificationResponseDTO;

interface INotificationService
{
    public function getForUser(string $userId): array;
    public function markAsRead(string $id, string $userId): void;
    public function markAllAsRead(string $userId): void;
}
