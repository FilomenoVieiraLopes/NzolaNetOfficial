<?php

namespace App\Interfaces\Services;

use App\DTOs\Comment\CreateCommentDTO;
use App\DTOs\Comment\UpdateCommentDTO;
use App\DTOs\Comment\CommentResponseDTO;

interface ICommentService
{
    public function getByPost(string $postId, ?int $viewerId = null, bool $viewerIsAdmin = false): array;
    public function create(CreateCommentDTO $dto, ?int $viewerId = null, bool $viewerIsAdmin = false): CommentResponseDTO;
    public function update(string $id, string $userId, UpdateCommentDTO $dto, bool $isAdmin = false): CommentResponseDTO;
    public function delete(string $id, string $userId, bool $isAdmin = false): void;
}
