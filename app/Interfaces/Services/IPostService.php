<?php

namespace App\Interfaces\Services;

use App\DTOs\Post\CreatePostDTO;
use App\DTOs\Post\UpdatePostDTO;
use App\DTOs\Post\PostResponseDTO;
use Illuminate\Pagination\LengthAwarePaginator;

interface IPostService
{
    public function getById(string $id, ?int $viewerId = null, bool $viewerIsAdmin = false): PostResponseDTO;
    public function create(CreatePostDTO $dto, ?int $viewerId = null, bool $viewerIsAdmin = false): PostResponseDTO;
    public function update(string $id, string $userId, UpdatePostDTO $dto, bool $isAdmin = false): PostResponseDTO;
    public function delete(string $id, string $userId, bool $isAdmin = false): void;
    public function getFeed(string $userId): LengthAwarePaginator;
    public function getAll(): LengthAwarePaginator;
    public function getByUser(string $userId): LengthAwarePaginator;
}
