<?php

namespace App\Interfaces\Repositories;

use App\Models\Comment;
use App\DTOs\Comment\CreateCommentDTO;
use App\DTOs\Comment\UpdateCommentDTO;
use Illuminate\Database\Eloquent\Collection;

interface ICommentRepository
{
    public function findById(string $id): ?Comment;
    public function create(CreateCommentDTO $dto): Comment;
    public function update(string $id, UpdateCommentDTO $dto): Comment;
    public function delete(string $id): bool;
    public function getByPost(string $postId): Collection;
}