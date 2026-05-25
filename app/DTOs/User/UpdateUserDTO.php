<?php

namespace App\DTOs\User;

class UpdateUserDTO
{
    public function __construct(
        // Campos opcionais: null significa que o campo nao foi enviado.
        public readonly ?string $name,
        public readonly ?string $bio,
        public readonly ?string $avatar_url,
        public readonly ?string $privacy,
    ) {}

    public static function fromArray(array $data): self
    {
        // Usa null como valor padrao para atualizacoes parciais.
        return new self(
            name: $data['name'] ?? null,
            bio: $data['bio'] ?? null,
            avatar_url: $data['avatar_url'] ?? null,
            privacy: $data['privacy'] ?? null,
        );
    }
}
