<?php

namespace App\DTOs\Notification;

use App\Models\Notification;

class NotificationResponseDTO
{
    public function __construct(
        // type indica o evento: baze, comment ou follow.
        public readonly int $id,
        public readonly int $user_id,
        public readonly string $type,
        public readonly int $related_id,
        public readonly bool $read,
        public readonly string $created_at,
    ) {}

    public static function fromModel(Notification $notification): self
    {
        return new self(
            id: $notification->id,
            user_id: $notification->user_id,
            type: $notification->type,
            related_id: $notification->related_id,
            read: $notification->read,
            created_at: $notification->created_at->toDateTimeString(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'         => $this->id,
            'user_id'    => $this->user_id,
            'type'       => $this->type,
            'related_id' => $this->related_id,
            'read'       => $this->read,
            'created_at' => $this->created_at,
        ];
    }
}
