<?php

namespace App\Interfaces\Services;

use App\DTOs\Baze\BazeResponseDTO;

interface IBazeService
{
    public function give(string $postId, string $userId): BazeResponseDTO;
    public function remove(string $postId, string $userId): void;
    public function count(string $postId): int;
    public function giveToComment(string $commentId, string $userId): array;
    public function removeFromComment(string $commentId, string $userId): void;
}
