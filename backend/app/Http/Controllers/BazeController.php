<?php

namespace App\Http\Controllers;

use App\Interfaces\Services\IBazeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BazeController extends Controller
{
    public function __construct(
        // O service valida existencia do post e impede baze duplicado.
        private readonly IBazeService $bazeService
    ) {}

    // POST /api/posts/{postId}/bazes
    public function store(Request $request, string $postId): JsonResponse
    {
        try {
            // Cria a reacao do utilizador autenticado na publicacao indicada.
            $baze = $this->bazeService->give($postId, (string) $request->user()->id);

            return response()->json([
                'message' => 'Baze dado com sucesso.',
                'baze'    => $baze->toArray(),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // DELETE /api/posts/{postId}/bazes
    public function destroy(Request $request, string $postId): JsonResponse
    {
        try {
            // Remove apenas o baze do utilizador autenticado nessa publicacao.
            $this->bazeService->remove($postId, (string) $request->user()->id);

            return response()->json([
                'message' => 'Baze removido com sucesso.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // POST /api/comments/{commentId}/bazes
    public function storeForComment(Request $request, string $commentId): JsonResponse
    {
        try {
            $baze = $this->bazeService->giveToComment($commentId, (string) $request->user()->id);

            return response()->json([
                'message' => 'Baze dado no comentario com sucesso.',
                'baze'    => $baze,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // DELETE /api/comments/{commentId}/bazes
    public function destroyForComment(Request $request, string $commentId): JsonResponse
    {
        try {
            $this->bazeService->removeFromComment($commentId, (string) $request->user()->id);

            return response()->json([
                'message' => 'Baze removido do comentario com sucesso.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
}
