<?php

namespace App\Interfaces\Services;

use App\DTOs\Comment\CreateCommentDTO;
use App\DTOs\Comment\UpdateCommentDTO;
use App\DTOs\Comment\CommentResponseDTO;

interface ICommentService
{
    public function getByPost(string $postId): array;
    public function create(CreateCommentDTO $dto): CommentResponseDTO;
    public function update(string $id, string $userId, UpdateCommentDTO $dto): CommentResponseDTO;
    public function delete(string $id, string $userId, bool $isAdmin = false): void;
}
