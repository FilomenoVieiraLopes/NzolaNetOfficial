<?php

namespace App\DTOs\Post;

class UpdatePostDTO
{
    public function __construct(
        // Campos opcionais para update parcial.
        public readonly ?string $content,
        public readonly ?string $image_url,
        public readonly ?string $video_url,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            content: $data['content'] ?? null,
            image_url: $data['image_url'] ?? null,
            video_url: $data['video_url'] ?? null,
        );
    }
}
