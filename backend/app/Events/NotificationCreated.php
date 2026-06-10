<?php

namespace App\Events;

use App\DTOs\Notification\NotificationResponseDTO;
use App\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $notification;

    public function __construct(Notification $notification)
    {
        $notification->loadMissing(['actor', 'post']);
        $this->notification = NotificationResponseDTO::fromModel($notification)->toArray();
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('users.' . $this->notification['user_id']);
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }
}
