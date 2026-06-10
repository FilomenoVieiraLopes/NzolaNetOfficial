<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FeedUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,
        public readonly ?int $post_id = null,
        public readonly ?int $actor_id = null,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('feed');
    }

    public function broadcastAs(): string
    {
        return 'feed.updated';
    }
}
