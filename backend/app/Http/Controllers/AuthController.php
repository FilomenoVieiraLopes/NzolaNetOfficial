<?php

namespace App\Http\Controllers;

use App\DTOs\User\RegisterUserDTO;
use App\Interfaces\Services\IAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        // O controller apenas recebe o request e delega regras de autenticacao ao service.
        private readonly IAuthService $authService
    ) {}

    // POST /api/auth/register
    public function register(Request $request): JsonResponse
    {
        // Valida o contrato esperado pelo frontend antes de criar a conta.
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        // O DTO transporta apenas os dados aceites para a camada de servico.
        $dto = RegisterUserDTO::fromArray($validated);

        // O service cria o utilizador e gera um token Sanctum para chamadas futuras.
        $result = $this->authService->register($dto);

        return response()->json([
            'message' => 'Registo efectuado com sucesso.',
            'user'    => $result['user'],
            'token'   => $result['token'],
        ], 201);
    }

    // POST /api/auth/login
    public function login(Request $request): JsonResponse
    {
        // Login recebe credenciais; validacao da senha acontece no AuthService.
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        try {
            $result = $this->authService->login(
                $validated['email'],
                $validated['password']
            );

            return response()->json([
                'message' => 'Login efectuado com sucesso.',
                'user'    => $result['user'],
                'token'   => $result['token'],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 401);
        }
    }

    // POST /api/auth/logout
    public function logout(Request $request): JsonResponse
    {
        // Revoga tokens para impedir reutilizacao depois do logout.
        $this->authService->logout($request->user());

        return response()->json([
            'message' => 'Sessao terminada com sucesso.',
        ]);
    }

    // POST /api/auth/forgot-password
    public function forgotPassword(Request $request): JsonResponse
    {
        // O Laravel gera o token de recuperacao e envia pelo mailer configurado.
        $request->validate([
            'email' => 'required|email',
        ]);

        try {
            $this->authService->forgotPassword($request->email);

            // Resposta generica evita revelar se o email existe.
            return response()->json([
                'message' => 'Se o email existir receberas instrucoes de recuperacao.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    // POST /api/auth/reset-password
    public function resetPassword(Request $request): JsonResponse
    {
        // O token vem do email; password_confirmation protege contra erro de digitacao.
        $validated = $request->validate([
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        try {
            $this->authService->resetPassword(
                $validated['token'],
                $validated['email'],
                $validated['password']
            );

            return response()->json([
                'message' => 'Senha alterada com sucesso.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 422);
        }
    }
}
