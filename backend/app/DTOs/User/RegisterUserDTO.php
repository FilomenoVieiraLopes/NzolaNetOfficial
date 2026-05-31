<?php

namespace App\DTOs\User;

class RegisterUserDTO
{
    public function __construct(
        // Dados minimos para criar uma conta.
        public readonly string $avatar_url,
        public readonly string $cover_url,
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
    ) {}

    public static function fromArray(array $data): self
    {
        // Converte o array validado pelo controller em objeto tipado.
        return new self(
            avatar_url: $data['avatar_url'] ?? '',
            cover_url: $data['cover_url'] ?? '',
            name: $data['name'],
            email: $data['email'],
            password: $data['password'],
        );
    }
}
