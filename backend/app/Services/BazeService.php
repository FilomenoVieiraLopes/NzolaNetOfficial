<?php

namespace App\Services;

use App\DTOs\Baze\BazeResponseDTO;
use App\Interfaces\Repositories\IBazeRepository;
use App\Interfaces\Repositories\ICommentRepository;
use App\Interfaces\Repositories\INotificationRepository;
use App\Interfaces\Repositories\IPostRepository;
use App\Interfaces\Services\IBazeService;

class BazeService implements IBazeService
{
    public function __construct(
        // Baze precisa validar post, guardar reacao e criar notificacao.
        private readonly IBazeRepository $bazeRepository,
        private readonly IPostRepository $postRepository,
        private readonly ICommentRepository $commentRepository,
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

    public function giveToComment(string $commentId, string $userId): array
    {
        $comment = $this->commentRepository->findById($commentId);

        if (!$comment) {
            throw new \Exception('Comentario nao encontrado.', 404);
        }

        $existing = $this->bazeRepository->findByCommentAndUser($commentId, $userId);

        if ($existing) {
            throw new \Exception('Ja deste baze neste comentario.', 422);
        }

        $baze = $this->bazeRepository->createForComment($commentId, $userId);

        // Notifica o autor do comentario quando outra pessoa reage ao comentario.
        if ((int) $comment->user_id !== (int) $userId) {
            $this->notificationRepository->create(
                (string) $comment->user_id,
                'comment_baze',
                $commentId,
                $userId,
                (string) $comment->post_id
            );
        }

        return [
            'id'         => (int) $baze->id,
            'comment_id' => (int) $baze->comment_id,
            'user_id'    => (int) $baze->user_id,
            'created_at' => $baze->created_at?->toDateTimeString() ?? '',
        ];
    }

    public function removeFromComment(string $commentId, string $userId): void
    {
        $comment = $this->commentRepository->findById($commentId);

        if (!$comment) {
            throw new \Exception('Comentario nao encontrado.', 404);
        }

        $existing = $this->bazeRepository->findByCommentAndUser($commentId, $userId);

        if (!$existing) {
            throw new \Exception('Ainda nao deste baze neste comentario.', 422);
        }

        $this->bazeRepository->deleteForComment($commentId, $userId);
    }
}
