<?php

namespace App\DTOs\Post;

use App\Models\Post;

class PostResponseDTO
{
    public function __construct(
        // Estrutura completa exigida pelo enunciado para mostrar publicacoes.
        public readonly int $id,
        public readonly string $author_name,
        public readonly string $author_avatar,
        public readonly int $user_id,
        public readonly string $content,
        public readonly ?string $image_url,
        public readonly ?string $video_url,
        public readonly int $bazes_count,
        public readonly int $comments_count,
        public readonly bool $has_bazed,
        public readonly bool $can_edit,
        public readonly bool $can_delete,
        public readonly string $created_at,
    ) {}

    public static function fromModel(Post $post, ?int $viewerId = null, bool $viewerIsAdmin = false): self
    {
        $isOwner = $viewerId !== null && (int) $post->user_id === $viewerId;

        return new self(
            id: $post->id,
            author_name: $post->user->name,
            author_avatar: $post->user->avatar_url ?? '',
            user_id: $post->user_id,
            content: $post->content,
            image_url: $post->image_url,
            video_url: $post->video_url,
            bazes_count: $post->bazes_count ?? $post->bazes()->count(),
            comments_count: $post->comments_count ?? $post->comments()->count(),
            has_bazed: $viewerId !== null && $post->bazes()->where('user_id', $viewerId)->exists(),
            can_edit: $isOwner || $viewerIsAdmin,
            can_delete: $isOwner || $viewerIsAdmin,
            created_at: $post->created_at->toDateTimeString(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'             => $this->id,
            'author_name'    => $this->author_name,
            'author_avatar'  => $this->author_avatar,
            'user_id'        => $this->user_id,
            'content'        => $this->content,
            'image_url'      => $this->image_url,
            'video_url'      => $this->video_url,
            'bazes_count'    => $this->bazes_count,
            'comments_count' => $this->comments_count,
            'has_bazed'      => $this->has_bazed,
            'can_edit'       => $this->can_edit,
            'can_delete'     => $this->can_delete,
            'created_at'     => $this->created_at,
        ];
    }
}
