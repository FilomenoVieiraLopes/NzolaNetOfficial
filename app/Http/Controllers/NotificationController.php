<?php

namespace App\Http\Controllers;

use App\Interfaces\Services\INotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        // O service limita as notificacoes ao utilizador autenticado.
        private readonly INotificationService $notificationService
    ) {}

    // GET /api/notifications
    public function index(Request $request): JsonResponse
    {
        // Retorna apenas notificacoes pertencentes ao utilizador do token.
        $notifications = $this->notificationService->getForUser(
            (string) $request->user()->id
        );

        return response()->json($notifications);
    }

    // PUT /api/notifications/{id}/read
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        try {
            // O userId impede marcar notificacoes de outros utilizadores.
            $this->notificationService->markAsRead($id, (string) $request->user()->id);

            return response()->json([
                'message' => 'Notificacao marcada como lida.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // PUT /api/notifications/read-all
    public function markAllAsRead(Request $request): JsonResponse
    {
        // Marca como lidas todas as notificacoes do utilizador autenticado.
        $this->notificationService->markAllAsRead((string) $request->user()->id);

        return response()->json([
            'message' => 'Todas as notificacoes marcadas como lidas.',
        ]);
    }
}
