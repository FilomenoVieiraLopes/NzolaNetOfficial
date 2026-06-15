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
        public readonly ?int $related_id,
        public readonly ?int $actor_id,
        public readonly ?string $actor_name,
        public readonly ?string $actor_avatar,
        public readonly ?int $post_id,
        public readonly ?string $post_excerpt,
        public readonly bool $read,
        public readonly string $created_at,
    ) {}

    public static function fromModel(Notification $notification): self
    {
        return new self(
            id: (int) $notification->id,
            user_id: (int) $notification->user_id,
            type: (string) ($notification->type ?? 'unknown'),
            related_id: $notification->related_id !== null ? (int) $notification->related_id : null,
            actor_id: $notification->actor_id !== null ? (int) $notification->actor_id : null,
            actor_name: $notification->actor?->name,
            actor_avatar: $notification->actor?->avatar_url,
            post_id: $notification->post_id !== null ? (int) $notification->post_id : null,
            post_excerpt: $notification->post?->content
                ? mb_substr($notification->post->content, 0, 90)
                : null,
            read: (bool) ($notification->read ?? false),
            created_at: $notification->created_at?->toDateTimeString() ?? '',
        );
    }

    public function toArray(): array
    {
        return [
            'id'         => $this->id,
            'user_id'    => $this->user_id,
            'type'       => $this->type,
            'related_id' => $this->related_id,
            'actor_id'   => $this->actor_id,
            'actor_name' => $this->actor_name,
            'actor_avatar' => $this->actor_avatar,
            'post_id'    => $this->post_id,
            'post_excerpt' => $this->post_excerpt,
            'read'       => $this->read,
            'created_at' => $this->created_at,
        ];
    }
}
