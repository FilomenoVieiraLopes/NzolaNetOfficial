<?php

namespace App\Services;

use App\DTOs\User\UpdateUserDTO;
use App\DTOs\User\UserResponseDTO;
use App\Interfaces\Repositories\IFollowRepository;
use App\Interfaces\Repositories\INotificationRepository;
use App\Interfaces\Repositories\IUserRepository;
use App\Interfaces\Services\IUserService;

class UserService implements IUserService
{
    public function __construct(
        // Cada repositorio cuida de uma parte da persistencia usada por usuarios.
        private readonly IUserRepository $userRepository,
        private readonly IFollowRepository $followRepository,
        private readonly INotificationRepository $notificationRepository,
    ) {}

    public function getById(string $id, ?string $viewerId = null): UserResponseDTO
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            throw new \Exception('Utilizador nao encontrado.', 404);
        }

        // Antes de devolver dados, aplica a regra de perfil publico/privado.
        $this->ensureProfileCanBeViewed($id, $viewerId);

        return UserResponseDTO::fromModel($user);
    }

    public function search(string $term): array
    {
        if (trim($term) === '') {
            return [];
        }

        return $this->userRepository
            ->search($term)
            ->map(fn($user) => UserResponseDTO::fromModel($user)->toArray())
            ->toArray();
    }

    public function update(string $id, UpdateUserDTO $dto): UserResponseDTO
    {
        // Garante erro controlado se o perfil nao existir.
        $this->ensureUserExists($id);

        $user = $this->userRepository->update($id, $dto);

        return UserResponseDTO::fromModel($user);
    }

    public function updateAvatar(string $id, string $avatarUrl): UserResponseDTO
    {
        // O controller guarda o ficheiro; o service grava a URL no perfil.
        $this->ensureUserExists($id);

        $user = $this->userRepository->updateAvatar($id, $avatarUrl);

        return UserResponseDTO::fromModel($user);
    }

    public function follow(string $followerId, string $followingId): void
    {
        // Ninguem pode seguir a si mesmo.
        if ((int) $followerId === (int) $followingId) {
            throw new \Exception('Nao podes seguir-te a ti proprio.', 422);
        }

        $this->ensureUserExists($followingId);

        // Evita duplicacao logica antes da constraint unica da base de dados.
        $existing = $this->followRepository->findByFollowerAndFollowing(
            $followerId,
            $followingId
        );

        if ($existing) {
            throw new \Exception('Ja segues este utilizador.', 422);
        }

        $this->followRepository->create($followerId, $followingId);

        // Notifica o perfil seguido sobre o novo seguidor.
        $this->notificationRepository->create(
            $followingId,
            'follow',
            $followerId,
            $followerId
        );
    }

    public function unfollow(string $followerId, string $followingId): void
    {
        $this->ensureUserExists($followingId);

        // So remove se a relacao existir; caso contrario devolve erro de regra.
        $existing = $this->followRepository->findByFollowerAndFollowing(
            $followerId,
            $followingId
        );

        if (!$existing) {
            throw new \Exception('Nao segues este utilizador.', 422);
        }

        $this->followRepository->delete($followerId, $followingId);
    }

    public function getFollowers(string $userId, ?string $viewerId = null): array
    {
        // A lista de seguidores tambem respeita privacidade do perfil.
        $this->ensureUserExists($userId);
        $this->ensureProfileCanBeViewed($userId, $viewerId);

        $followers = $this->followRepository->getFollowers($userId);

        return $followers->map(function ($follow) {
            return UserResponseDTO::fromModel($follow->follower);
        })->toArray();
    }

    public function getFollowing(string $userId, ?string $viewerId = null): array
    {
        // A lista de perfis seguidos respeita a mesma regra de acesso.
        $this->ensureUserExists($userId);
        $this->ensureProfileCanBeViewed($userId, $viewerId);

        $following = $this->followRepository->getFollowing($userId);

        return $following->map(function ($follow) {
            return UserResponseDTO::fromModel($follow->following);
        })->toArray();
    }

    private function ensureUserExists(string $id): void
    {
        if (!$this->userRepository->findById($id)) {
            throw new \Exception('Utilizador nao encontrado.', 404);
        }
    }

    private function ensureProfileCanBeViewed(string $profileId, ?string $viewerId): void
    {
        $profile = $this->userRepository->findById($profileId);

        // Perfis publicos podem ser vistos por qualquer utilizador autenticado.
        if (!$profile || $profile->privacy === 'public') {
            return;
        }

        // O dono sempre pode ver o proprio perfil.
        if ($viewerId !== null && (int) $profileId === (int) $viewerId) {
            return;
        }

        // Seguidores autorizados podem ver perfis privados.
        if ($viewerId !== null && $this->followRepository->findByFollowerAndFollowing($viewerId, $profileId)) {
            return;
        }

        throw new \Exception('Este perfil e privado.', 403);
    }
}
