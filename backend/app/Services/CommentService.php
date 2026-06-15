<?php

namespace App\Services;

use App\DTOs\Comment\CommentResponseDTO;
use App\DTOs\Comment\CreateCommentDTO;
use App\DTOs\Comment\UpdateCommentDTO;
use App\Interfaces\Repositories\ICommentRepository;
use App\Interfaces\Repositories\INotificationRepository;
use App\Interfaces\Repositories\IPostRepository;
use App\Interfaces\Services\ICommentService;

class CommentService implements ICommentService
{
    public function __construct(
        // Comentarios dependem do post para validar existencia e gerar notificacoes.
        private readonly ICommentRepository $commentRepository,
        private readonly IPostRepository $postRepository,
        private readonly INotificationRepository $notificationRepository,
    ) {}

    public function getByPost(string $postId, ?int $currentUserId = null, bool $isAdmin = false): array
    {
        // Nao retorna lista vazia para post inexistente; devolve 404 controlado.
        if (!$this->postRepository->findById($postId)) {
            throw new \Exception('Publicacao nao encontrada.', 404);
        }

        $comments = $this->commentRepository->getByPost($postId);

        return $comments->map(function ($comment) use ($currentUserId, $isAdmin) {
            return CommentResponseDTO::fromModel($comment, $currentUserId, $isAdmin)->toArray();
        })->toArray();
    }

    public function create(CreateCommentDTO $dto): CommentResponseDTO
    {
        // Comentario so pode existir associado a uma publicacao real.
        $post = $this->postRepository->findById($dto->post_id);

        if (!$post) {
            throw new \Exception('Publicacao nao encontrada.', 404);
        }

        $parentComment = null;

        if ($dto->parent_id) {
            $parentComment = $this->commentRepository->findById((string) $dto->parent_id);

            if (!$parentComment || (int) $parentComment->post_id !== (int) $dto->post_id) {
                throw new \Exception('Comentario original invalido para esta publicacao.', 422);
            }

            if ($parentComment->parent_id) {
                // Mantemos apenas um nivel de respostas para a tela ficar simples.
                $dto = new CreateCommentDTO(
                    post_id: $dto->post_id,
                    user_id: $dto->user_id,
                    body: $dto->body,
                    parent_id: (int) $parentComment->parent_id
                );
                $parentComment = $this->commentRepository->findById((string) $parentComment->parent_id);
            }
        }

        $comment = $this->commentRepository->create($dto);

        // Resposta notifica o autor do comentario respondido; comentario normal notifica o autor do post.
        if ($parentComment && (int) $parentComment->user_id !== (int) $dto->user_id) {
            $this->notificationRepository->create(
                $parentComment->user_id,
                'comment_reply',
                $comment->id,
                (string) $dto->user_id,
                (string) $dto->post_id
            );
        } elseif (!$parentComment && (int) $post->user_id !== (int) $dto->user_id) {
            $this->notificationRepository->create(
                $post->user_id,
                'comment',
                $comment->id,
                (string) $dto->user_id,
                (string) $dto->post_id
            );
        }

        return CommentResponseDTO::fromModel($comment, (int) $dto->user_id);
    }

    public function update(string $id, string $userId, UpdateCommentDTO $dto): CommentResponseDTO
    {
        $comment = $this->commentRepository->findById($id);

        if (!$comment) {
            throw new \Exception('Comentario nao encontrado.', 404);
        }

        // Apenas o autor pode editar o proprio comentario.
        if ((int) $comment->user_id !== (int) $userId) {
            throw new \Exception('Sem permissao para editar este comentario.', 403);
        }

        $updated = $this->commentRepository->update($id, $dto);

        return CommentResponseDTO::fromModel($updated, (int) $userId);
    }

    public function delete(string $id, string $userId, bool $isAdmin = false): void
    {
        $comment = $this->commentRepository->findById($id);

        if (!$comment) {
            throw new \Exception('Comentario nao encontrado.', 404);
        }

        // Autor apaga o proprio comentario; admin pode moderar comentarios ofensivos.
        if (!$isAdmin && (int) $comment->user_id !== (int) $userId) {
            throw new \Exception('Sem permissao para apagar este comentario.', 403);
        }

        $this->commentRepository->delete($id);
    }
}
