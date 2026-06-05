<?php

namespace App\Interfaces\Repositories;

use App\Models\Follow;
use Illuminate\Database\Eloquent\Collection;

interface IFollowRepository
{
    public function findByFollowerAndFollowing(string $followerId, string $followingId): ?Follow;
    public function create(string $followerId, string $followingId, string $status = 'accepted'): Follow;
    public function delete(string $followerId, string $followingId): bool;
    public function getFollowers(string $userId): Collection;
    public function getFollowing(string $userId): Collection;
    public function getPendingRequests(string $userId): Collection;
    public function accept(string $followerId, string $followingId): bool;
}
