<?php

namespace App\Http\Controllers;

use App\DTOs\Comment\CreateCommentDTO;
use App\DTOs\Comment\UpdateCommentDTO;
use App\Interfaces\Services\ICommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function __construct(
        // Regras de autoria/moderacao ficam no service.
        private readonly ICommentService $commentService
    ) {}

    // GET /api/posts/{postId}/comments
    public function index(string $postId): JsonResponse
    {
        try {
            // Retorna comentarios de uma publicacao existente.
            $comments = $this->commentService->getByPost($postId);

            return response()->json($comments);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // POST /api/posts/{postId}/comments
    public function store(Request $request, string $postId): JsonResponse
    {
        // O frontend envia so o texto; post_id vem da rota e user_id do token.
        $validated = $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $validated['post_id'] = $postId;
        $validated['user_id'] = $request->user()->id;

        try {
            $dto = CreateCommentDTO::fromArray($validated);
            $comment = $this->commentService->create($dto);

            return response()->json([
                'message' => 'Comentario adicionado com sucesso.',
                'comment' => $comment->toArray(),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // PUT /api/comments/{id}
    public function update(Request $request, string $id): JsonResponse
    {
        // O service confirma se o autenticado e o autor do comentario.
        $validated = $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        try {
            $dto = UpdateCommentDTO::fromArray($validated);
            $comment = $this->commentService->update($id, (string) $request->user()->id, $dto);

            return response()->json([
                'message' => 'Comentario actualizado com sucesso.',
                'comment' => $comment->toArray(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // DELETE /api/comments/{id}
    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            // Admin pode moderar comentarios; utilizador normal so apaga os seus.
            $this->commentService->delete(
                $id,
                (string) $request->user()->id,
                $request->user()->isAdmin()
            );

            return response()->json([
                'message' => 'Comentario eliminado com sucesso.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
}
