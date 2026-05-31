<?php

namespace App\Interfaces\Repositories;

use App\Models\Baze;

interface IBazeRepository
{
    public function findByPostAndUser(string $postId, string $userId): ?Baze;
    public function create(string $postId, string $userId): Baze;
    public function delete(string $postId, string $userId): bool;
    public function countByPost(string $postId): int;
}