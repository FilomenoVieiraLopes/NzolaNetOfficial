<?php

namespace App\Repositories;

use App\DTOs\Comment\CreateCommentDTO;
use App\DTOs\Comment\UpdateCommentDTO;
use App\Interfaces\Repositories\ICommentRepository;
use App\Models\Comment;
use Illuminate\Database\Eloquent\Collection;

class CommentRepository implements ICommentRepository
{
    public function findById(string $id): ?Comment
    {
        // Carrega autor para montar DTO e verificar regras no service.
        return Comment::with('user')->find($id);
    }

    public function create(CreateCommentDTO $dto): Comment
    {
        $comment = Comment::create([
            'post_id' => $dto->post_id,
            'user_id' => $dto->user_id,
            'body'    => $dto->body,
        ]);

        return $comment->load('user');
    }

    public function update(string $id, UpdateCommentDTO $dto): Comment
    {
        $comment = Comment::findOrFail($id);
        $comment->update(['body' => $dto->body]);

        return $comment->fresh()->load('user');
    }

    public function delete(string $id): bool
    {
        return Comment::findOrFail($id)->delete();
    }

    public function getByPost(string $postId): Collection
    {
        // Comentarios aparecem do mais antigo para o mais recente.
        return Comment::with('user')
            ->where('post_id', $postId)
            ->orderBy('created_at', 'asc')
            ->get();
    }
}
