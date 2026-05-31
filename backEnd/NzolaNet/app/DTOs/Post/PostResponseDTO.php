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
        public readonly string $created_at,
    ) {}

    public static function fromModel(Post $post): self
    {
        // Usa contadores carregados com withCount quando existirem.
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
            'created_at'     => $this->created_at,
        ];
    }
}
