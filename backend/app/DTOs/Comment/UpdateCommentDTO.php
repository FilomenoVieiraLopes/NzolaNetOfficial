<?php

namespace App\DTOs\Comment;

class UpdateCommentDTO
{
    public function __construct(
        // No update de comentario so o texto muda.
        public readonly string $body,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            body: $data['body'],
        );
    }
}
