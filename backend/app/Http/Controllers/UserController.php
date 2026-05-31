<?php

namespace App\Http\Controllers;

use App\DTOs\User\UpdateUserDTO;
use App\Interfaces\Services\IUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        // Mantem o controller fino: regras de perfil/seguidores ficam no service.
        private readonly IUserService $userService
    ) {}

    // GET /api/users/{id}
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            // viewerId permite aplicar privacidade: publico, proprio dono ou seguidor.
            $user = $this->userService->getById($id, (string) $request->user()->id);

            return response()->json($user->toArray());

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // PUT /api/users/{id}
    public function update(Request $request, string $id): JsonResponse
    {
        // Um utilizador so pode editar o proprio perfil.
        if ((int) $request->user()->id !== (int) $id) {
            return response()->json([
                'message' => 'Sem permissao para editar este perfil.',
            ], 403);
        }

        // Apenas estes campos sao editaveis pela API publica.
        $validated = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'bio'       => 'sometimes|string|max:500',
            'avatar_url'=> 'sometimes|nullable|url',
            'cover_url' => 'sometimes|nullable|url',
            'privacy'   => 'sometimes|in:public,private',
        ]);

        try {
            $dto = UpdateUserDTO::fromArray($validated);
            $user = $this->userService->update($id, $dto);

            return response()->json([
                'message' => 'Perfil actualizado com sucesso.',
                'user'    => $user->toArray(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // POST /api/users/{id}/avatar
    public function updateAvatar(Request $request, string $id): JsonResponse
    {
        // Avatar tambem so pode ser alterado pelo dono da conta.
        if ((int) $request->user()->id !== (int) $id) {
            return response()->json([
                'message' => 'Sem permissao para alterar este avatar.',
            ], 403);
        }

        // Limita formato e tamanho para evitar ficheiros perigosos ou muito grandes.
        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        // Guarda a imagem no disco publico e grava apenas a URL no perfil.
        $path = $request->file('avatar')->store('avatars', 'public');
        $url = asset('storage/' . $path);

        try {
            $user = $this->userService->updateAvatar($id, $url);

            return response()->json([
                'message'    => 'Avatar actualizado com sucesso.',
                'avatar_url' => $user->avatar_url,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // POST /api/users/{id}/follow
    public function follow(Request $request, string $id): JsonResponse
    {
        try {
            // O autenticado segue o utilizador indicado na rota.
            $this->userService->follow((string) $request->user()->id, $id);

            return response()->json([
                'message' => 'Utilizador seguido com sucesso.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // DELETE /api/users/{id}/follow
    public function unfollow(Request $request, string $id): JsonResponse
    {
        try {
            // Remove a relacao de seguir entre autenticado e utilizador alvo.
            $this->userService->unfollow((string) $request->user()->id, $id);

            return response()->json([
                'message' => 'Deixaste de seguir o utilizador.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // GET /api/users/{id}/followers
    public function followers(Request $request, string $id): JsonResponse
    {
        try {
            // Lista seguidores apenas se o perfil puder ser visto pelo autenticado.
            $followers = $this->userService->getFollowers($id, (string) $request->user()->id);

            return response()->json($followers);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // GET /api/users/{id}/following
    public function following(Request $request, string $id): JsonResponse
    {
        try {
            // Lista quem o perfil segue, tambem respeitando a privacidade.
            $following = $this->userService->getFollowing($id, (string) $request->user()->id);

            return response()->json($following);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
}
