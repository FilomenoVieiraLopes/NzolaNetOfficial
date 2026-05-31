<?php

namespace App\Interfaces\Repositories;

use App\Models\User;
use App\DTOs\User\RegisterUserDTO;
use App\DTOs\User\UpdateUserDTO;
use Illuminate\Database\Eloquent\Collection;

interface IUserRepository
{
    public function findById(string $id): ?User;
    public function findByEmail(string $email): ?User;
    public function search(string $term): Collection;
    public function create(RegisterUserDTO $dto): User;
    public function update(string $id, UpdateUserDTO $dto): User;
    public function updateAvatar(string $id, string $avatarUrl): User;
    public function delete(string $id): bool;
}
