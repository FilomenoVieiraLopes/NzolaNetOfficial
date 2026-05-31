<?php

namespace App\Interfaces\Services;

use App\DTOs\User\RegisterUserDTO;
use App\Models\User;

interface IAuthService
{
    public function register(RegisterUserDTO $dto): array;
    public function login(string $email, string $password): array;
    public function logout(User $user): void;

    // Envia email com link de reset
    public function forgotPassword(string $email): void;

    // Valida token e altera a senha
    public function resetPassword(string $token, string $email, string $password): void;
}