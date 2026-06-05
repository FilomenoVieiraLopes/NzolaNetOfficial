<?php

namespace App\Interfaces\Repositories;

use App\Models\Baze;
use App\Models\CommentBaze;

interface IBazeRepository
{
    public function findByPostAndUser(string $postId, string $userId): ?Baze;
    public function create(string $postId, string $userId): Baze;
    public function delete(string $postId, string $userId): bool;
    public function countByPost(string $postId): int;
    public function findByCommentAndUser(string $commentId, string $userId): ?CommentBaze;
    public function createForComment(string $commentId, string $userId): CommentBaze;
    public function deleteForComment(string $commentId, string $userId): bool;
}
