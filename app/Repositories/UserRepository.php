<?php

namespace App\Repositories;

use App\DTOs\User\RegisterUserDTO;
use App\DTOs\User\UpdateUserDTO;
use App\Interfaces\Repositories\IUserRepository;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserRepository implements IUserRepository
{
    public function findById(string $id): ?User
    {
        // Busca simples por chave primaria.
        return User::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        // Usado no login e recuperacao de senha.
        return User::where('email', $email)->first();
    }

    public function create(RegisterUserDTO $dto): User
    {
        // Hash::make garante que a senha nunca e guardada em texto puro.
        return User::create([
            'name'     => $dto->name,
            'email'    => $dto->email,
            'password' => Hash::make($dto->password),
        ]);
    }

    public function update(string $id, UpdateUserDTO $dto): User
    {
        $user = User::findOrFail($id);

        // array_filter remove campos nao enviados para nao apagar dados existentes.
        $user->update(array_filter([
            'name'    => $dto->name,
            'bio'     => $dto->bio,
            'privacy' => $dto->privacy,
        ], fn($value) => !is_null($value)));

        return $user->fresh();
    }

    public function updateAvatar(string $id, string $avatarUrl): User
    {
        // Avatar fica salvo como URL publica.
        $user = User::findOrFail($id);
        $user->update(['avatar_url' => $avatarUrl]);

        return $user->fresh();
    }

    public function delete(string $id): bool
    {
        // Mantido para uso futuro de administracao de utilizadores.
        return User::findOrFail($id)->delete();
    }
}
