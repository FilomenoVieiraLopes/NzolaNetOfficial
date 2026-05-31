<?php

namespace App\Services;

use App\DTOs\Post\CreatePostDTO;
use App\DTOs\Post\PostResponseDTO;
use App\DTOs\Post\UpdatePostDTO;
use App\Interfaces\Repositories\IPostRepository;
use App\Interfaces\Services\IPostService;
use Illuminate\Pagination\LengthAwarePaginator;

class PostService implements IPostService
{
    public function __construct(
        // Repositorio concentra consultas e persistencia de publicacoes.
        private readonly IPostRepository $postRepository,
    ) {}

    public function getById(string $id, ?int $viewerId = null, bool $viewerIsAdmin = false): PostResponseDTO
    {
        // Busca com autor e contadores para montar a resposta completa.
        $post = $this->postRepository->findById($id);

        if (!$post) {
            throw new \Exception('Publicacao nao encontrada.', 404);
        }

        return PostResponseDTO::fromModel($post, $viewerId, $viewerIsAdmin);
    }

    public function create(CreatePostDTO $dto, ?int $viewerId = null, bool $viewerIsAdmin = false): PostResponseDTO
    {
        // Cria a publicacao associada ao utilizador autenticado.
        $post = $this->postRepository->create($dto);

        return PostResponseDTO::fromModel($post, $viewerId, $viewerIsAdmin);
    }

    public function update(string $id, string $userId, UpdatePostDTO $dto, bool $isAdmin = false): PostResponseDTO
    {
        $post = $this->postRepository->findById($id);

        if (!$post) {
            throw new \Exception('Publicacao nao encontrada.', 404);
        }

        // Regra do enunciado: apenas o autor edita a propria publicacao.
        if (!$isAdmin && (int) $post->user_id !== (int) $userId) {
            throw new \Exception('Sem permissao para editar esta publicacao.', 403);
        }

        $updated = $this->postRepository->update($id, $dto);

        return PostResponseDTO::fromModel($updated, (int) $userId, $isAdmin);
    }

    public function delete(string $id, string $userId, bool $isAdmin = false): void
    {
        $post = $this->postRepository->findById($id);

        if (!$post) {
            throw new \Exception('Publicacao nao encontrada.', 404);
        }

        // Regra do enunciado: apenas o autor apaga a propria publicacao.
        if (!$isAdmin && (int) $post->user_id !== (int) $userId) {
            throw new \Exception('Sem permissao para apagar esta publicacao.', 403);
        }

        $this->postRepository->delete($id);
    }

    public function getFeed(string $userId): LengthAwarePaginator
    {
        // Feed personalizado: publicacoes dos perfis seguidos pelo utilizador.
        return $this->postRepository->getFeedForUser($userId);
    }

    public function getAll(): LengthAwarePaginator
    {
        // Feed principal: publicacoes recentes, em ordem cronologica inversa.
        return $this->postRepository->getAllPaginated();
    }

    public function getByUser(string $userId): LengthAwarePaginator
    {
        return $this->postRepository->getByUser($userId);
    }
}
