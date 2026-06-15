<?php

namespace App\DTOs\Baze;

use App\Models\Baze;

class BazeResponseDTO
{
    public function __construct(
        // Dados da reacao devolvidos apos criar um baze.
        public readonly int $id,
        public readonly int $post_id,
        public readonly int $user_id,
        public readonly string $created_at,
    ) {}

    public static function fromModel(Baze $baze): self
    {
        return new self(
            id: (int) $baze->id,
            post_id: (int) $baze->post_id,
            user_id: (int) $baze->user_id,
            created_at: $baze->created_at?->toDateTimeString() ?? '',
        );
    }

    public function toArray(): array
    {
        return [
            'id'         => $this->id,
            'post_id'    => $this->post_id,
            'user_id'    => $this->user_id,
            'created_at' => $this->created_at,
        ];
    }
}
