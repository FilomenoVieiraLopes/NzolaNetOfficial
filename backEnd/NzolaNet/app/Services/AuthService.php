<?php

namespace App\Services;

use App\DTOs\User\RegisterUserDTO;
use App\Interfaces\Repositories\IUserRepository;
use App\Interfaces\Services\IAuthService;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthService implements IAuthService
{
    public function __construct(
        // Repositorio isola acesso a tabela users.
        private readonly IUserRepository $userRepository
    ) {}

    public function register(RegisterUserDTO $dto): array
    {
        // Cria o utilizador com senha protegida pelo repository.
        $user = $this->userRepository->create($dto);

        // Sanctum devolve token simples para o frontend usar no Authorization header.
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    public function login(string $email, string $password): array
    {
        // Auth::attempt compara senha enviada com o hash guardado.
        if (!Auth::attempt(['email' => $email, 'password' => $password])) {
            throw new \Exception('Credenciais invalidas.', 401);
        }

        $user = $this->userRepository->findByEmail($email);

        // Mantem apenas um conjunto de tokens activos por utilizador.
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    public function logout(User $user): void
    {
        // Apaga todos os tokens para terminar sessoes activas desse utilizador.
        $user->tokens()->delete();
    }

    public function forgotPassword(string $email): void
    {
        // Nao envia email se a conta nao existir.
        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            // Retorna sem erro para nao revelar se o email esta registado.
            return;
        }

        // Usa o broker padrao do Laravel para criar token e enviar notificacao.
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw new \Exception('Erro ao enviar email de recuperacao.', 500);
        }
    }

    public function resetPassword(string $token, string $email, string $password): void
    {
        // Password::reset valida token/email e executa callback se estiver tudo certo.
        $status = Password::reset(
            [
                'email'                 => $email,
                'password'              => $password,
                'password_confirmation' => $password,
                'token'                 => $token,
            ],
            function (User $user, string $password) {
                // Atualiza senha, troca remember_token e revoga tokens antigos.
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw new \Exception('Token invalido ou expirado.', 422);
        }
    }
}
