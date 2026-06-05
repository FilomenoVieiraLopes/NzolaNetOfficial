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

        $follow = $viewerId !== null
            ? $this->followRepository->findByFollowerAndFollowing($viewerId, $id)
            : null;
        $canViewPrivateContent = $this->canViewPrivateContent($id, $viewerId);

        return UserResponseDTO::fromModel(
            $user,
            $follow?->status,
            $canViewPrivateContent
        );
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

    public function suggestions(string $viewerId): array
    {
        return $this->userRepository
            ->suggestions($viewerId)
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

    public function updateCover(string $id, string $coverUrl): UserResponseDTO
    {
        // The controller stores the file; the service saves the URL on the profile.
        $this->ensureUserExists($id);

        $user = $this->userRepository->updateCover($id, $coverUrl);

        return UserResponseDTO::fromModel($user);
    }

    public function follow(string $followerId, string $followingId): string
    {
        // Ninguem pode seguir a si mesmo.
        if ((int) $followerId === (int) $followingId) {
            throw new \Exception('Nao podes seguir-te a ti proprio.', 422);
        }

        $target = $this->userRepository->findById($followingId);

        if (!$target) {
            throw new \Exception('Utilizador nao encontrado.', 404);
        }

        // Evita duplicacao logica antes da constraint unica da base de dados.
        $existing = $this->followRepository->findByFollowerAndFollowing(
            $followerId,
            $followingId
        );

        if ($existing) {
            if ($existing->status === 'pending') {
                throw new \Exception('O pedido para seguir ja esta pendente.', 422);
            }

            throw new \Exception('Ja segues este utilizador.', 422);
        }

        $status = $target->privacy === 'private' ? 'pending' : 'accepted';
        $this->followRepository->create($followerId, $followingId, $status);

        // Notifica o perfil seguido sobre o novo seguidor ou pedido.
        $this->notificationRepository->create(
            $followingId,
            $status === 'pending' ? 'follow_request' : 'follow',
            $followerId,
            $followerId
        );

        return $status;
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
            throw new \Exception('Nao existe relacao de seguimento com este utilizador.', 422);
        }

        $this->followRepository->delete($followerId, $followingId);
    }

    public function getPendingFollowRequests(string $userId): array
    {
        $this->ensureUserExists($userId);

        return $this->followRepository
            ->getPendingRequests($userId)
            ->map(fn($follow) => UserResponseDTO::fromModel($follow->follower)->toArray())
            ->toArray();
    }

    public function acceptFollowRequest(string $ownerId, string $followerId): void
    {
        $existing = $this->followRepository->findByFollowerAndFollowing($followerId, $ownerId);

        if (!$existing || $existing->status !== 'pending') {
            throw new \Exception('Pedido para seguir nao encontrado.', 404);
        }

        $this->followRepository->accept($followerId, $ownerId);

        $this->notificationRepository->create(
            $followerId,
            'follow_accepted',
            $ownerId,
            $ownerId
        );
    }

    public function rejectFollowRequest(string $ownerId, string $followerId): void
    {
        $existing = $this->followRepository->findByFollowerAndFollowing($followerId, $ownerId);

        if (!$existing || $existing->status !== 'pending') {
            throw new \Exception('Pedido para seguir nao encontrado.', 404);
        }

        $this->followRepository->delete($followerId, $ownerId);
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

        if ($this->canViewPrivateContent($profileId, $viewerId)) {
            return;
        }

        throw new \Exception('Este perfil e privado.', 403);
    }

    public function canViewPrivateContent(string $profileId, ?string $viewerId): bool
    {
        $profile = $this->userRepository->findById($profileId);

        if (!$profile || $profile->privacy === 'public') {
            return true;
        }

        if ($viewerId !== null && (int) $profileId === (int) $viewerId) {
            return true;
        }

        $follow = $viewerId !== null
            ? $this->followRepository->findByFollowerAndFollowing($viewerId, $profileId)
            : null;

        return $follow?->status === 'accepted';
    }
}
