<?php

namespace App\Services;

use App\DTOs\Baze\BazeResponseDTO;
use App\Interfaces\Repositories\IBazeRepository;
use App\Interfaces\Repositories\INotificationRepository;
use App\Interfaces\Repositories\IPostRepository;
use App\Interfaces\Services\IBazeService;

class BazeService implements IBazeService
{
    public function __construct(
        // Baze precisa validar post, guardar reacao e criar notificacao.
        private readonly IBazeRepository $bazeRepository,
        private readonly IPostRepository $postRepository,
        private readonly INotificationRepository $notificationRepository,
    ) {}

    public function give(string $postId, string $userId): BazeResponseDTO
    {
        // Um baze so pode ser dado numa publicacao existente.
        $post = $this->postRepository->findById($postId);

        if (!$post) {
            throw new \Exception('Publicacao nao encontrada.', 404);
        }

        // O mesmo utilizador so pode dar um baze por publicacao.
        $existing = $this->bazeRepository->findByPostAndUser($postId, $userId);

        if ($existing) {
            throw new \Exception('Ja deste baze nesta publicacao.', 422);
        }

        $baze = $this->bazeRepository->create($postId, $userId);

        // Notifica o autor quando outra pessoa reage a publicacao.
        if ((int) $post->user_id !== (int) $userId) {
            $this->notificationRepository->create(
                $post->user_id,
                'baze',
                $postId,
                $userId,
                $postId
            );
        }

        return BazeResponseDTO::fromModel($baze);
    }

    public function remove(string $postId, string $userId): void
    {
        // Remove apenas se o utilizador realmente tinha dado baze.
        $existing = $this->bazeRepository->findByPostAndUser($postId, $userId);

        if (!$existing) {
            throw new \Exception('Ainda nao deste baze nesta publicacao.', 422);
        }

        $this->bazeRepository->delete($postId, $userId);
    }

    public function count(string $postId): int
    {
        // Usado quando for preciso consultar a quantidade sem carregar posts.
        return $this->bazeRepository->countByPost($postId);
    }
}
