<?php

namespace App\DTOs\Comment;

class CreateCommentDTO
{
    public function __construct(
        // Dados necessarios para gravar um comentario.
        public readonly int $post_id,
        public readonly int $user_id,
        public readonly string $body,
        public readonly ?int $parent_id = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            post_id: $data['post_id'],
            user_id: $data['user_id'],
            body: $data['body'],
            parent_id: isset($data['parent_id']) ? (int) $data['parent_id'] : null,
        );
    }
}
