<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NzolaNetApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_own_profile_when_route_id_is_string(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->putJson("/api/users/{$user->id}", [
            'name' => 'Nzola User',
        ])->assertOk()
            ->assertJsonPath('user.name', 'Nzola User');
    }

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

    public function test_baze_response_serializes_created_at(): void
    {
        $user = User::factory()->create();
        $post = Post::create([
            'user_id' => $user->id,
            'content' => 'Publicacao com baze',
        ]);

        Sanctum::actingAs($user);

        $this->postJson("/api/posts/{$post->id}/bazes")
            ->assertCreated()
            ->assertJsonStructure(['baze' => ['id', 'post_id', 'user_id', 'created_at']]);
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $owner->id,
            'type' => 'follow',
            'related_id' => $other->id,
        ]);

        Sanctum::actingAs($other);

        $this->putJson("/api/notifications/{$notification->id}/read")
            ->assertNotFound();

        $this->assertFalse($notification->fresh()->read);
    }

    public function test_comments_for_missing_post_return_not_found(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/posts/999/comments')
            ->assertNotFound();
    }

    public function test_private_profile_is_visible_only_to_followers_or_owner(): void
    {
        $owner = User::factory()->create(['privacy' => 'private']);
        $stranger = User::factory()->create();
        $follower = User::factory()->create();

        Sanctum::actingAs($stranger);

        $this->getJson("/api/users/{$owner->id}")
            ->assertForbidden();

        Sanctum::actingAs($follower);

        $this->postJson("/api/users/{$owner->id}/follow")
            ->assertOk();

        $this->getJson("/api/users/{$owner->id}")
            ->assertOk()
            ->assertJsonPath('id', $owner->id);

        Sanctum::actingAs($owner);

        $this->getJson("/api/users/{$owner->id}")
            ->assertOk();
    }

    public function test_admin_can_delete_another_users_comment(): void
    {
        $author = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicacao com comentario ofensivo',
        ]);

        $comment = \App\Models\Comment::create([
            'post_id' => $post->id,
            'user_id' => $author->id,
            'body' => 'Comentario a moderar',
        ]);

        Sanctum::actingAs($admin);

        $this->deleteJson("/api/comments/{$comment->id}")
            ->assertOk();

        $this->assertDatabaseMissing('comments', [
            'id' => $comment->id,
        ]);
    }

    public function test_user_search_finds_matching_profiles(): void
    {
        User::factory()->create(['name' => 'Maria Nzola', 'email' => 'maria@example.com']);
        User::factory()->create(['name' => 'Outro Nome']);

        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/users/search?q=Maria')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Maria Nzola']);
    }

    public function test_post_response_includes_baze_state_and_permissions(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $post = Post::create([
            'user_id' => $owner->id,
            'content' => 'Post com estado de baze',
        ]);

        Sanctum::actingAs($viewer);

        $this->postJson("/api/posts/{$post->id}/bazes")
            ->assertCreated();

        $this->getJson("/api/posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('has_bazed', true)
            ->assertJsonPath('can_edit', false)
            ->assertJsonPath('can_delete', false);
    }

    public function test_following_feed_contains_followed_users_posts(): void
    {
        $author = User::factory()->create();
        $viewer = User::factory()->create();

        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Post de alguem seguido',
        ]);

        Sanctum::actingAs($viewer);

        $this->postJson("/api/users/{$author->id}/follow")
            ->assertOk();

        $this->getJson('/api/posts/feed')
            ->assertOk()
            ->assertJsonFragment(['id' => $post->id]);
    }

    public function test_notifications_include_actor_and_post_context(): void
    {
        $owner = User::factory()->create();
        $actor = User::factory()->create(['name' => 'Actor Context']);
        $post = Post::create([
            'user_id' => $owner->id,
            'content' => 'Post que recebe comentario para notificacao',
        ]);

        Sanctum::actingAs($actor);

        $this->postJson("/api/posts/{$post->id}/comments", [
            'body' => 'Comentario com contexto',
        ])->assertCreated();

        Sanctum::actingAs($owner);

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonFragment([
                'actor_name' => 'Actor Context',
                'post_id' => $post->id,
            ]);
    }

    public function test_user_posts_endpoint_returns_only_that_users_posts(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $ownerPost = Post::create([
            'user_id' => $owner->id,
            'content' => 'Post do perfil certo',
        ]);

        Post::create([
            'user_id' => $other->id,
            'content' => 'Post de outro perfil',
        ]);

        Sanctum::actingAs($owner);

        $this->getJson("/api/users/{$owner->id}/posts")
            ->assertOk()
            ->assertJsonFragment(['id' => $ownerPost->id])
            ->assertJsonMissing(['content' => 'Post de outro perfil']);
    }
}
