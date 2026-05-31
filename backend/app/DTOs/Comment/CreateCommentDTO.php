<?php

namespace App\DTOs\Comment;

class CreateCommentDTO
{
    public function __construct(
        // Dados necessarios para gravar um comentario.
        public readonly int $post_id,
        public readonly int $user_id,
        public readonly string $body,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            post_id: $data['post_id'],
            user_id: $data['user_id'],
            body: $data['body'],
        );
    }
}
