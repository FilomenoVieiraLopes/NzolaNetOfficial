<?php

namespace App\Interfaces\Repositories;

use App\Models\Notification;
use Illuminate\Database\Eloquent\Collection;

interface INotificationRepository
{
    public function create(string $userId, string $type, string $relatedId): Notification;
    public function getByUser(string $userId): Collection;
    public function markAsRead(string $id, string $userId): bool;
    public function markAllAsRead(string $userId): bool;
}
