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
        public readonly bool $can_edit,
        public readonly bool $can_delete,
        public readonly int $bazes_count,
        public readonly bool $has_bazed,
        public readonly string $created_at,
    ) {}

    public static function fromModel(Comment $comment, ?int $currentUserId = null, bool $isAdmin = false): self
    {
        $isAuthor = $currentUserId !== null && (int) $comment->user_id === $currentUserId;
        $hasBazed = $currentUserId !== null && $comment->bazes()
            ->where('user_id', $currentUserId)
            ->exists();

        return new self(
            id: (int) $comment->id,
            post_id: (int) $comment->post_id,
            user_id: (int) $comment->user_id,
            author_name: $comment->user?->name ?? 'Utilizador removido',
            author_avatar: $comment->user?->avatar_url,
            body: (string) ($comment->body ?? ''),
            can_edit: $isAuthor,
            can_delete: $isAuthor || $isAdmin,
            bazes_count: (int) ($comment->bazes_count ?? $comment->bazes()->count()),
            has_bazed: $hasBazed,
            created_at: $comment->created_at?->toDateTimeString() ?? '',
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
            'can_edit'      => $this->can_edit,
            'can_delete'    => $this->can_delete,
            'bazes_count'   => $this->bazes_count,
            'has_bazed'     => $this->has_bazed,
            'created_at'    => $this->created_at,
        ];
    }
}
