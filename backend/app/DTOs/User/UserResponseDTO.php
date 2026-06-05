<?php

namespace App\DTOs\User;

use App\Models\User;

class UserResponseDTO
{
    public function __construct(
        // Formato publico do utilizador enviado ao frontend.
        public readonly int $id,
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $avatar_url,
        public readonly ?string $cover_url,
        public readonly ?string $bio,
        public readonly string $privacy,
        public readonly string $role,
        public readonly string $created_at,
        public readonly ?string $follow_status = null,
        public readonly bool $can_view_private_content = true,
        public readonly int $followers_count = 0,
        public readonly int $following_count = 0,
    ) {}

    public static function fromModel(
        User $user,
        ?string $followStatus = null,
        bool $canViewPrivateContent = true,
        ?int $followersCount = null,
        ?int $followingCount = null
    ): self
    {
        // Mapeia o model Eloquent para um objeto sem senha/remember_token.
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            avatar_url: $user->avatar_url,
            cover_url: $user->cover_url,
            bio: $user->bio,
            privacy: $user->privacy,
            role: $user->role ?? 'user',
            created_at: $user->created_at->toDateTimeString(),
            follow_status: $followStatus,
            can_view_private_content: $canViewPrivateContent,
            followers_count: $followersCount ?? $user->followers()->where('status', 'accepted')->count(),
            following_count: $followingCount ?? $user->following()->where('status', 'accepted')->count(),
        );
    }

    public function toArray(): array
    {
        // Resposta final consumida pela API.
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'avatar_url' => $this->avatar_url,
            'cover_url'  => $this->cover_url,
            'bio'        => $this->bio,
            'privacy'    => $this->privacy,
            'role'       => $this->role,
            'created_at' => $this->created_at,
            'follow_status' => $this->follow_status,
            'can_view_private_content' => $this->can_view_private_content,
            'followers_count' => $this->followers_count,
            'following_count' => $this->following_count,
        ];
    }
}
