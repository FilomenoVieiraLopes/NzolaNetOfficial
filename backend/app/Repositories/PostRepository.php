<?php

namespace App\Repositories;

use App\DTOs\Post\CreatePostDTO;
use App\DTOs\Post\UpdatePostDTO;
use App\Interfaces\Repositories\IPostRepository;
use App\Models\Follow;
use App\Models\Post;
use Illuminate\Pagination\LengthAwarePaginator;

class PostRepository implements IPostRepository
{
    public function findById(string $id): ?Post
    {
        // Carrega autor e contadores para evitar consultas extras no DTO.
        return Post::with('user')
            ->withCount(['bazes', 'comments'])
            ->find($id);
    }

    public function create(CreatePostDTO $dto): Post
    {
        $post = Post::create([
            'user_id'   => $dto->user_id,
            'content'   => $dto->content,
            'image_url' => $dto->image_url,
            'video_url' => $dto->video_url,
        ]);

        // Recarrega relacoes usadas na resposta da API.
        return $post->load('user')->loadCount(['bazes', 'comments']);
    }

    public function update(string $id, UpdatePostDTO $dto): Post
    {
        $post = Post::findOrFail($id);

        // Atualiza apenas campos enviados; null significa "nao alterar".
        $post->update(array_filter([
            'content'   => $dto->content,
            'image_url' => $dto->image_url,
            'video_url' => $dto->video_url,
        ], fn($value) => !is_null($value)));

        return $post->fresh()->load('user')->loadCount(['bazes', 'comments']);
    }

    public function delete(string $id): bool
    {
        return Post::findOrFail($id)->delete();
    }

    public function getAllPaginated(): LengthAwarePaginator
    {
        // Feed principal em ordem cronologica inversa.
        return Post::with('user')
            ->withCount(['bazes', 'comments'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);
    }

    public function getFeedForUser(string $userId): LengthAwarePaginator
    {
        // Primeiro descobre quem o utilizador segue.
        $followingIds = Follow::where('follower_id', $userId)
            ->pluck('following_id');

        // Depois retorna apenas posts desses utilizadores.
        return Post::with('user')
            ->withCount(['bazes', 'comments'])
            ->whereIn('user_id', $followingIds)
            ->orderBy('created_at', 'desc')
            ->paginate(10);
    }
}
