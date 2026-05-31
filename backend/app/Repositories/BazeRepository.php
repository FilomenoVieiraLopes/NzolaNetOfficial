<?php

namespace App\Repositories;

use App\Interfaces\Repositories\IBazeRepository;
use App\Models\Baze;

class BazeRepository implements IBazeRepository
{
    public function findByPostAndUser(string $postId, string $userId): ?Baze
    {
        // Procura a reacao especifica para impedir duplicados.
        return Baze::where('post_id', $postId)
            ->where('user_id', $userId)
            ->first();
    }

    public function create(string $postId, string $userId): Baze
    {
        return Baze::create([
            'post_id' => $postId,
            'user_id' => $userId,
        ]);
    }

    public function delete(string $postId, string $userId): bool
    {
        // Remove somente o baze daquele utilizador naquele post.
        return Baze::where('post_id', $postId)
            ->where('user_id', $userId)
            ->delete();
    }

    public function countByPost(string $postId): int
    {
        return Baze::where('post_id', $postId)->count();
    }
}
