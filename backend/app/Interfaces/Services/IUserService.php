<?php

namespace App\Interfaces\Services;

use App\DTOs\User\UpdateUserDTO;
use App\DTOs\User\UserResponseDTO;

interface IUserService
{
    public function getById(string $id, ?string $viewerId = null): UserResponseDTO;
    public function search(string $term): array;
    public function update(string $id, UpdateUserDTO $dto): UserResponseDTO;
    public function updateAvatar(string $id, string $avatarUrl): UserResponseDTO;
    public function updateCover(string $id, string $coverUrl): UserResponseDTO;
    public function follow(string $followerId, string $followingId): void;
    public function unfollow(string $followerId, string $followingId): void;
    public function getFollowers(string $userId, ?string $viewerId = null): array;
    public function getFollowing(string $userId, ?string $viewerId = null): array;
}
