<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Notification;
use App\Models\Post;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class InteractionApiTest extends ApiTestCase
{
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

    public function test_user_cannot_give_duplicate_baze_to_same_post(): void
    {
        $author = User::factory()->create();
        $viewer = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicacao para testar duplicado',
        ]);

        Sanctum::actingAs($viewer);

        $this->postJson("/api/posts/{$post->id}/bazes")
            ->assertCreated();

        $this->postJson("/api/posts/{$post->id}/bazes")
            ->assertUnprocessable();

        $this->assertDatabaseCount('bazes', 1);
    }

    public function test_user_can_remove_own_baze_from_post(): void
    {
        $author = User::factory()->create();
        $viewer = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicacao para remover baze',
        ]);

        Sanctum::actingAs($viewer);

        $this->postJson("/api/posts/{$post->id}/bazes")
            ->assertCreated();

        $this->deleteJson("/api/posts/{$post->id}/bazes")
            ->assertOk();

        $this->assertDatabaseMissing('bazes', [
            'post_id' => $post->id,
            'user_id' => $viewer->id,
        ]);
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

    public function test_baze_and_comment_create_notifications_for_post_owner(): void
    {
        $owner = User::factory()->create();
        $actor = User::factory()->create();
        $post = Post::create([
            'user_id' => $owner->id,
            'content' => 'Publicacao que recebe notificacoes',
        ]);

        Sanctum::actingAs($actor);

        $this->postJson("/api/posts/{$post->id}/bazes")
            ->assertCreated();

        $this->postJson("/api/posts/{$post->id}/comments", [
            'body' => 'Comentario com notificacao',
        ])->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'actor_id' => $actor->id,
            'type' => 'baze',
            'post_id' => $post->id,
            'read' => false,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'actor_id' => $actor->id,
            'type' => 'comment',
            'post_id' => $post->id,
            'read' => false,
        ]);
    }

    public function test_baze_on_comment_creates_notification_for_comment_owner(): void
    {
        $postOwner = User::factory()->create();
        $commentOwner = User::factory()->create();
        $actor = User::factory()->create();
        $post = Post::create([
            'user_id' => $postOwner->id,
            'content' => 'Publicacao com comentario que recebe baze',
        ]);
        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $commentOwner->id,
            'body' => 'Comentario com baze',
        ]);

        Sanctum::actingAs($actor);

        $this->postJson("/api/comments/{$comment->id}/bazes")
            ->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $commentOwner->id,
            'actor_id' => $actor->id,
            'type' => 'comment_baze',
            'related_id' => $comment->id,
            'post_id' => $post->id,
            'read' => false,
        ]);
    }

    public function test_comments_for_missing_post_return_not_found(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/posts/999/comments')
            ->assertNotFound();
    }

    public function test_admin_can_delete_another_users_comment(): void
    {
        $author = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicacao com comentario ofensivo',
        ]);

        $comment = Comment::create([
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

    public function test_user_cannot_edit_or_delete_another_users_comment(): void
    {
        $author = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicacao com comentario protegido',
        ]);
        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $author->id,
            'body' => 'Comentario original',
        ]);

        Sanctum::actingAs($other);

        $this->putJson("/api/comments/{$comment->id}", [
            'body' => 'Tentativa indevida',
        ])->assertForbidden();

        $this->deleteJson("/api/comments/{$comment->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'body' => 'Comentario original',
        ]);
    }
}
