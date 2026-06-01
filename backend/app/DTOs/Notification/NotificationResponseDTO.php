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
            id: $notification->id,
            user_id: $notification->user_id,
            type: $notification->type,
            related_id: $notification->related_id,
            actor_id: $notification->actor_id,
            actor_name: $notification->actor?->name,
            actor_avatar: $notification->actor?->avatar_url,
            post_id: $notification->post_id,
            post_excerpt: $notification->post?->content
                ? mb_substr($notification->post->content, 0, 90)
                : null,
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
