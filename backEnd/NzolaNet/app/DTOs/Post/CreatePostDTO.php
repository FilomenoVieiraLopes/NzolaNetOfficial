<?php

namespace App\DTOs\Post;

class CreatePostDTO
{
    public function __construct(
        // Dados necessarios para criar uma publicacao.
        public readonly int $user_id,
        public readonly string $content,
        public readonly ?string $image_url,
        public readonly ?string $video_url,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            user_id: $data['user_id'],
            content: $data['content'],
            image_url: $data['image_url'] ?? null,
            video_url: $data['video_url'] ?? null,
        );
    }
}
