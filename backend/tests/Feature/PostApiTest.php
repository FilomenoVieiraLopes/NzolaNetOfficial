<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

class PostApiTest extends ApiTestCase
{
    public function test_user_can_update_own_post_when_route_id_is_string(): void
    {
        $user = User::factory()->create();
        $post = Post::create([
            'user_id' => $user->id,
            'content' => 'Conteudo inicial',
        ]);

        Sanctum::actingAs($user);

        $this->putJson("/api/posts/{$post->id}", [
            'content' => 'Conteudo actualizado',
        ])->assertOk()
            ->assertJsonPath('post.content', 'Conteudo actualizado');
    }

    public function test_user_can_create_post_with_image_and_video(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/posts', [
            'content' => 'Publicacao com media',
            'image' => $this->fakePngUpload('post.png'),
            'video' => UploadedFile::fake()->create('video.mp4', 1024, 'video/mp4'),
        ])->assertCreated()
            ->assertJsonPath('post.content', 'Publicacao com media')
            ->assertJsonStructure(['post' => ['image_url', 'video_url']]);

        $post = Post::firstWhere('content', 'Publicacao com media');
        $this->assertNotNull($post?->image_url);
        $this->assertNotNull($post?->video_url);
    }

    public function test_user_cannot_update_or_delete_another_users_post(): void
    {
        $author = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Post protegido',
        ]);

        Sanctum::actingAs($other);

        $this->putJson("/api/posts/{$post->id}", [
            'content' => 'Tentativa indevida',
        ])->assertForbidden();

        $this->deleteJson("/api/posts/{$post->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'content' => 'Post protegido',
        ]);
    }

    public function test_admin_can_delete_another_users_post(): void
    {
        $author = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Post para moderacao',
        ]);

        Sanctum::actingAs($admin);

        $this->deleteJson("/api/posts/{$post->id}")
            ->assertOk();

        $this->assertDatabaseMissing('posts', [
            'id' => $post->id,
        ]);
    }
}
