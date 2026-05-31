<?php

namespace App\Providers;

use App\Interfaces\Repositories\IBazeRepository;
use App\Interfaces\Repositories\ICommentRepository;
use App\Interfaces\Repositories\IFollowRepository;
use App\Interfaces\Repositories\INotificationRepository;
use App\Interfaces\Repositories\IPostRepository;
use App\Interfaces\Repositories\IUserRepository;
use App\Interfaces\Services\IAuthService;
use App\Interfaces\Services\IBazeService;
use App\Interfaces\Services\ICommentService;
use App\Interfaces\Services\INotificationService;
use App\Interfaces\Services\IPostService;
use App\Interfaces\Services\IUserService;
use App\Repositories\BazeRepository;
use App\Repositories\CommentRepository;
use App\Repositories\FollowRepository;
use App\Repositories\NotificationRepository;
use App\Repositories\PostRepository;
use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Services\BazeService;
use App\Services\CommentService;
use App\Services\NotificationService;
use App\Services\PostService;
use App\Services\UserService;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Liga interfaces a implementacoes concretas.
        // Isto permite trocar implementacoes sem alterar controllers/services.
        $this->app->bind(IUserRepository::class, UserRepository::class);
        $this->app->bind(IPostRepository::class, PostRepository::class);
        $this->app->bind(ICommentRepository::class, CommentRepository::class);
        $this->app->bind(IBazeRepository::class, BazeRepository::class);
        $this->app->bind(IFollowRepository::class, FollowRepository::class);
        $this->app->bind(INotificationRepository::class, NotificationRepository::class);

        // Regista services usados pelos controllers.
        $this->app->bind(IAuthService::class, AuthService::class);
        $this->app->bind(IUserService::class, UserService::class);
        $this->app->bind(IPostService::class, PostService::class);
        $this->app->bind(ICommentService::class, CommentService::class);
        $this->app->bind(IBazeService::class, BazeService::class);
        $this->app->bind(INotificationService::class, NotificationService::class);
    }
}
