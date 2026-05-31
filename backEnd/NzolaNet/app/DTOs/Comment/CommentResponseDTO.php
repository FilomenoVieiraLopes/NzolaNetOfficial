<?php

namespace App\DTOs\Comment;

use App\Models\Comment;

class CommentResponseDTO
{
    public function __construct(
        // Formato do comentario devolvido ao frontend.
        public readonly int $id,
        public readonly int $post_id,
        public readonly int $user_id,
        public readonly string $author_name,
        public readonly ?string $author_avatar,
        public readonly string $body,
        public readonly string $created_at,
    ) {}

    public static function fromModel(Comment $comment): self
    {
        return new self(
            id: $comment->id,
            post_id: $comment->post_id,
            user_id: $comment->user_id,
            author_name: $comment->user->name,
            author_avatar: $comment->user->avatar_url,
            body: $comment->body,
            created_at: $comment->created_at->toDateTimeString(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'            => $this->id,
            'post_id'       => $this->post_id,
            'user_id'       => $this->user_id,
            'author_name'   => $this->author_name,
            'author_avatar' => $this->author_avatar,
            'body'          => $this->body,
            'created_at'    => $this->created_at,
        ];
    }
}
