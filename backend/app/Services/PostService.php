<?php

namespace App\Services;

use App\DTOs\Post\CreatePostDTO;
use App\DTOs\Post\PostResponseDTO;
use App\DTOs\Post\UpdatePostDTO;
use App\Events\FeedUpdated;
use App\Interfaces\Repositories\IFollowRepository;
use App\Interfaces\Repositories\IPostRepository;
use App\Interfaces\Repositories\IUserRepository;
use App\Interfaces\Services\IPostService;
use Illuminate\Pagination\LengthAwarePaginator;

class PostService implements IPostService
{
    public function __construct(
        // Repositorio concentra consultas e persistencia de publicacoes.
        private readonly IPostRepository $postRepository,
        private readonly IUserRepository $userRepository,
        private readonly IFollowRepository $followRepository,
    ) {}

    public function getById(string $id, ?int $currentUserId = null, bool $isAdmin = false): PostResponseDTO
    {
        // Busca com autor e contadores para montar a resposta completa.
        $post = $this->postRepository->findById($id);

        if (!$post) {
            throw new \Exception('Publicacao nao encontrada.', 404);
        }

        return PostResponseDTO::fromModel($post, $currentUserId, $isAdmin);
    }

    public function create(CreatePostDTO $dto): PostResponseDTO
    {
        // Cria a publicacao associada ao utilizador autenticado.
        $post = $this->postRepository->create($dto);
        event(new FeedUpdated('post.created', (int) $post->id, (int) $post->user_id));

        return PostResponseDTO::fromModel($post, (int) $dto->user_id);
    }

    public function update(string $id, string $userId, UpdatePostDTO $dto, bool $isAdmin = false): PostResponseDTO
    {
        $post = $this->postRepository->findById($id);

        if (!$post) {
            throw new \Exception('Publicacao nao encontrada.', 404);
        }

        // Autor edita a propria publicacao; admin pode moderar conteudo.
        if (!$isAdmin && (int) $post->user_id !== (int) $userId) {
            throw new \Exception('Sem permissao para editar esta publicacao.', 403);
        }

        $updated = $this->postRepository->update($id, $dto);
        event(new FeedUpdated('post.updated', (int) $updated->id, (int) $updated->user_id));

        return PostResponseDTO::fromModel($updated, (int) $userId, $isAdmin);
    }

    public function delete(string $id, string $userId, bool $isAdmin = false): void
    {
        $post = $this->postRepository->findById($id);

        if (!$post) {
            throw new \Exception('Publicacao nao encontrada.', 404);
        }

        // Autor apaga a propria publicacao; admin pode moderar conteudo.
        if (!$isAdmin && (int) $post->user_id !== (int) $userId) {
            throw new \Exception('Sem permissao para apagar esta publicacao.', 403);
        }

        $this->postRepository->delete($id);
        event(new FeedUpdated('post.deleted', (int) $post->id, (int) $userId));
    }

    public function getFeed(string $userId): LengthAwarePaginator
    {
        // Feed personalizado: publicacoes dos perfis seguidos pelo utilizador.
        return $this->postRepository->getFeedForUser($userId);
    }

    public function getAll(?string $viewerId = null): LengthAwarePaginator
    {
        // Feed principal: publicacoes recentes, em ordem cronologica inversa.
        return $this->postRepository->getAllPaginated($viewerId);
    }

    public function getByUser(string $userId, ?string $viewerId = null): LengthAwarePaginator
    {
        $profile = $this->userRepository->findById($userId);

        if (!$profile) {
            throw new \Exception('Utilizador nao encontrado.', 404);
        }

        if ($profile->privacy === 'private' && (int) $viewerId !== (int) $userId) {
            $follow = $viewerId !== null
                ? $this->followRepository->findByFollowerAndFollowing($viewerId, $userId)
                : null;

            if ($follow?->status !== 'accepted') {
                throw new \Exception('Este perfil e privado.', 403);
            }
        }

        return $this->postRepository->getByUser($userId);
    }
}
