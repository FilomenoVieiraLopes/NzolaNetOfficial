<?php

namespace App\Repositories;

use App\Interfaces\Repositories\IFollowRepository;
use App\Models\Follow;
use Illuminate\Database\Eloquent\Collection;

class FollowRepository implements IFollowRepository
{
    public function findByFollowerAndFollowing(string $followerId, string $followingId): ?Follow
    {
        // Identifica se um utilizador ja segue outro.
        return Follow::where('follower_id', $followerId)
            ->where('following_id', $followingId)
            ->first();
    }

    public function create(string $followerId, string $followingId): Follow
    {
        return Follow::create([
            'follower_id'  => $followerId,
            'following_id' => $followingId,
        ]);
    }

    public function delete(string $followerId, string $followingId): bool
    {
        // Remove a relacao follower -> following.
        return Follow::where('follower_id', $followerId)
            ->where('following_id', $followingId)
            ->delete();
    }

    public function getFollowers(string $userId): Collection
    {
        // Quem segue este utilizador.
        return Follow::with('follower')
            ->where('following_id', $userId)
            ->get();
    }

    public function getFollowing(string $userId): Collection
    {
        // Quem este utilizador segue.
        return Follow::with('following')
            ->where('follower_id', $userId)
            ->get();
    }
}
