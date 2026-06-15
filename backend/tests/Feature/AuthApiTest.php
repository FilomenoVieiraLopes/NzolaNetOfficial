<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;

class AuthApiTest extends ApiTestCase
{
    public function test_user_can_register_and_receive_token(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Novo Utilizador',
            'email' => 'novo@nzolanet.test',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertCreated()
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token'])
            ->assertJsonPath('user.email', 'novo@nzolanet.test');

        $this->assertDatabaseHas('users', [
            'email' => 'novo@nzolanet.test',
        ]);
    }

    public function test_user_can_login_and_previous_tokens_are_revoked(): void
    {
        $user = User::factory()->create([
            'email' => 'login@nzolanet.test',
            'password' => Hash::make('secret123'),
        ]);
        $oldToken = $user->createToken('old_token')->accessToken;

        $this->postJson('/api/auth/login', [
            'email' => 'login@nzolanet.test',
            'password' => 'secret123',
        ])->assertOk()
            ->assertJsonStructure(['user' => ['id', 'email'], 'token']);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $oldToken->id,
        ]);
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_login_with_invalid_credentials_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'invalid-login@nzolanet.test',
            'password' => Hash::make('correct-password'),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'invalid-login@nzolanet.test',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    public function test_protected_routes_require_authentication(): void
    {
        $this->getJson('/api/posts')
            ->assertUnauthorized();

        $this->postJson('/api/posts', [
            'content' => 'Tentativa sem token',
        ])->assertUnauthorized();
    }

    public function test_expired_token_is_rejected(): void
    {
        config(['sanctum.expiration' => 120]);

        $user = User::factory()->create();
        $token = $user->createToken('expired_token');
        $token->accessToken->forceFill([
            'created_at' => now()->subMinutes(121),
            'updated_at' => now()->subMinutes(121),
        ])->save();

        $this->withHeader('Authorization', 'Bearer ' . $token->plainTextToken)
            ->getJson('/api/posts')
            ->assertUnauthorized();
    }

    public function test_logout_revokes_current_user_tokens(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $user->createToken('extra_token');

        $this->postJson('/api/auth/logout')
            ->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'tokenable_type' => User::class,
        ]);
    }

    public function test_forgot_password_returns_generic_response_and_creates_reset_token(): void
    {
        User::factory()->create([
            'email' => 'recover@nzolanet.test',
        ]);

        $this->postJson('/api/auth/forgot-password', [
            'email' => 'recover@nzolanet.test',
        ])->assertOk()
            ->assertJsonPath('message', 'Se o email existir receberas instrucoes de recuperacao.');

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'recover@nzolanet.test',
        ]);
    }

    public function test_reset_password_with_invalid_token_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'reset-invalid@nzolanet.test',
        ]);

        $this->postJson('/api/auth/reset-password', [
            'email' => 'reset-invalid@nzolanet.test',
            'token' => 'invalid-token',
            'password' => 'new-secret',
            'password_confirmation' => 'new-secret',
        ])->assertUnprocessable();
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'reset-valid@nzolanet.test',
            'password' => Hash::make('old-secret'),
        ]);
        $token = Password::createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'email' => 'reset-valid@nzolanet.test',
            'token' => $token,
            'password' => 'new-secret',
            'password_confirmation' => 'new-secret',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-secret', $user->fresh()->password));
    }
}
