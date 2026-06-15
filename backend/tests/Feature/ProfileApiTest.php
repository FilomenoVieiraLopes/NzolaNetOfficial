<?php

namespace Tests\Feature;

use App\Models\Follow;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

class ProfileApiTest extends ApiTestCase
{
    public function test_user_can_update_own_profile_when_route_id_is_string(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->putJson("/api/users/{$user->id}", [
            'name' => 'Nzola User',
        ])->assertOk()
            ->assertJsonPath('user.name', 'Nzola User');
    }

    public function test_user_can_upload_avatar_and_cover(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson("/api/users/{$user->id}/avatar", [
            'avatar' => $this->fakePngUpload('avatar.png'),
        ])->assertOk()
            ->assertJsonStructure(['avatar_url', 'user']);

        $this->postJson("/api/users/{$user->id}/cover", [
            'cover' => $this->fakePngUpload('cover.png'),
        ])->assertOk()
            ->assertJsonStructure(['cover_url', 'user']);

        $this->assertNotNull($user->fresh()->avatar_url);
        $this->assertNotNull($user->fresh()->cover_url);
    }

    public function test_user_cannot_upload_avatar_for_another_user(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $other = User::factory()->create();

        Sanctum::actingAs($other);

        $this->postJson("/api/users/{$owner->id}/avatar", [
            'avatar' => $this->fakePngUpload('avatar.png'),
        ])->assertForbidden();
    }

    public function test_private_profile_shows_basic_info_until_follow_request_is_accepted(): void
    {
        $owner = User::factory()->create(['privacy' => 'private']);
        $stranger = User::factory()->create();
        $follower = User::factory()->create();

        Sanctum::actingAs($stranger);

        $this->getJson("/api/users/{$owner->id}")
            ->assertOk()
            ->assertJsonPath('id', $owner->id)
            ->assertJsonPath('can_view_private_content', false);

        $this->getJson("/api/users/{$owner->id}/posts")
            ->assertForbidden();

        Sanctum::actingAs($follower);

        $this->postJson("/api/users/{$owner->id}/follow")
            ->assertOk()
            ->assertJsonPath('status', 'pending');

        $this->getJson("/api/users/{$owner->id}")
            ->assertOk()
            ->assertJsonPath('id', $owner->id)
            ->assertJsonPath('follow_status', 'pending')
            ->assertJsonPath('can_view_private_content', false);

        Sanctum::actingAs($owner);

        $this->putJson("/api/users/follow-requests/{$follower->id}/accept")
            ->assertOk();

        Sanctum::actingAs($follower);

        $this->getJson("/api/users/{$owner->id}")
            ->assertOk()
            ->assertJsonPath('follow_status', 'accepted')
            ->assertJsonPath('can_view_private_content', true);

        Sanctum::actingAs($owner);

        $this->getJson("/api/users/{$owner->id}")
            ->assertOk();
    }

    public function test_following_feed_only_includes_accepted_followed_users(): void
    {
        $viewer = User::factory()->create();
        $publicFollowed = User::factory()->create(['privacy' => 'public']);
        $privatePending = User::factory()->create(['privacy' => 'private']);

        $visiblePost = Post::create([
            'user_id' => $publicFollowed->id,
            'content' => 'Post visivel no feed seguindo',
        ]);
        Post::create([
            'user_id' => $privatePending->id,
            'content' => 'Post privado ainda pendente',
        ]);

        Follow::create([
            'follower_id' => $viewer->id,
            'following_id' => $publicFollowed->id,
            'status' => 'accepted',
        ]);
        Follow::create([
            'follower_id' => $viewer->id,
            'following_id' => $privatePending->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($viewer);

        $this->getJson('/api/posts/feed')
            ->assertOk()
            ->assertJsonPath('data.0.id', $visiblePost->id)
            ->assertJsonCount(1, 'data');
    }
}
