<?php

namespace App\Http\Controllers;

use App\DTOs\Post\CreatePostDTO;
use App\DTOs\Post\PostResponseDTO;
use App\DTOs\Post\UpdatePostDTO;
use App\Interfaces\Services\IPostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function __construct(
        // Todas as regras sobre publicacoes ficam no service.
        private readonly IPostService $postService
    ) {}

    // GET /api/posts
    public function index(Request $request): JsonResponse
    {
        // Feed principal: todas as publicacoes recentes, paginadas.
        $posts = $this->postService->getAll((string) $request->user()->id);

        // Converte modelos em DTOs para controlar o formato enviado ao frontend.
        $posts->through(fn($post) => PostResponseDTO::fromModel(
            $post,
            (int) $request->user()->id,
            $request->user()->isAdmin()
        )->toArray());

        return response()->json($posts);
    }

    // GET /api/users/{userId}/posts
    public function byUser(Request $request, string $userId): JsonResponse
    {
        try {
            $posts = $this->postService->getByUser($userId, (string) $request->user()->id);
            $posts->through(fn($post) => PostResponseDTO::fromModel(
                $post,
                (int) $request->user()->id,
                $request->user()->isAdmin()
            )->toArray());

            return response()->json($posts);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // GET /api/posts/feed
    public function feed(Request $request): JsonResponse
    {
        // Feed personalizado: apenas publicacoes de utilizadores seguidos.
        $posts = $this->postService->getFeed((string) $request->user()->id);

        $posts->through(fn($post) => PostResponseDTO::fromModel(
            $post,
            (int) $request->user()->id,
            $request->user()->isAdmin()
        )->toArray());

        return response()->json($posts);
    }

    // GET /api/posts/{id}
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            // O service valida existencia e devolve o DTO de resposta.
            $post = $this->postService->getById(
                $id,
                (int) $request->user()->id,
                $request->user()->isAdmin()
            );

            return response()->json($post->toArray());

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // POST /api/posts
    public function store(Request $request): JsonResponse
    {
        // Cada publicacao precisa de texto e pode receber imagem e/ou video.
        $validated = $request->validate([
            'content' => 'required|string|max:2000',
            'image'   => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'video'   => 'sometimes|nullable|file|mimes:mp4,mov,avi|max:51200',
        ]);

        // Guarda a imagem no disco publico quando enviada.
        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('posts/images', 'public');
            $imageUrl = asset('storage/' . $path);
        }

        // Guarda o video no disco publico quando enviado.
        $videoUrl = null;
        if ($request->hasFile('video')) {
            $path = $request->file('video')->store('posts/videos', 'public');
            $videoUrl = asset('storage/' . $path);
        }

        // Junta dados do request com o utilizador autenticado.
        $data = [
            'user_id'   => $request->user()->id,
            'content'   => $validated['content'],
            'image_url' => $imageUrl,
            'video_url' => $videoUrl,
        ];

        try {
            $dto = CreatePostDTO::fromArray($data);
            $post = $this->postService->create($dto);

            return response()->json([
                'message' => 'Publicacao criada com sucesso.',
                'post'    => $post->toArray(),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // PUT /api/posts/{id}
    public function update(Request $request, string $id): JsonResponse
    {
        // Campos opcionais permitem atualizar so texto, so imagem ou so video.
        $validated = $request->validate([
            'content' => 'sometimes|string|max:2000',
            'image'   => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'video'   => 'sometimes|nullable|file|mimes:mp4,mov,avi|max:51200',
        ]);

        try {
            // Confirma autoria antes de fazer upload, evitando ficheiros orfaos.
            $existingPost = $this->postService->getById(
                $id,
                (int) $request->user()->id,
                $request->user()->isAdmin()
            );

            if (!$request->user()->isAdmin() && (int) $existingPost->user_id !== (int) $request->user()->id) {
                return response()->json([
                    'message' => 'Sem permissao para editar esta publicacao.',
                ], 403);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }

        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('posts/images', 'public');
            $imageUrl = asset('storage/' . $path);
        }

        $videoUrl = null;
        if ($request->hasFile('video')) {
            $path = $request->file('video')->store('posts/videos', 'public');
            $videoUrl = asset('storage/' . $path);
        }

        $data = [
            'content'   => $validated['content'] ?? null,
            'image_url' => $imageUrl,
            'video_url' => $videoUrl,
        ];

        try {
            $dto = UpdatePostDTO::fromArray($data);
            $post = $this->postService->update(
                $id,
                (string) $request->user()->id,
                $dto,
                $request->user()->isAdmin()
            );

            return response()->json([
                'message' => 'Publicacao actualizada com sucesso.',
                'post'    => $post->toArray(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // DELETE /api/posts/{id}
    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            // O service garante autoria; admin pode moderar publicacoes.
            $this->postService->delete(
                $id,
                (string) $request->user()->id,
                $request->user()->isAdmin()
            );

            return response()->json([
                'message' => 'Publicacao eliminada com sucesso.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
}
