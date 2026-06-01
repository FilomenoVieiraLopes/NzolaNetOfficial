<?php

namespace App\Interfaces\Repositories;

use App\Models\Post;
use App\DTOs\Post\CreatePostDTO;
use App\DTOs\Post\UpdatePostDTO;
use Illuminate\Pagination\LengthAwarePaginator;

interface IPostRepository
{
    public function findById(string $id): ?Post;
    public function create(CreatePostDTO $dto): Post;
    public function update(string $id, UpdatePostDTO $dto): Post;
    public function delete(string $id): bool;
    public function getAllPaginated(): LengthAwarePaginator;
    public function getFeedForUser(string $userId): LengthAwarePaginator;
    public function getByUser(string $userId): LengthAwarePaginator;
}
