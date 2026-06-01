<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BazeController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Rotas publicas: usadas antes de existir token Sanctum.
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Rotas protegidas: todas exigem Authorization: Bearer <token>.
Route::middleware('auth:sanctum')->group(function () {

    // Sessao autenticada.
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Utilizadores, perfil, avatar e relacoes de follow.
    Route::get('/users/search', [UserController::class, 'search']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::post('/users/{id}/avatar', [UserController::class, 'updateAvatar']);
    Route::post('/users/{id}/follow', [UserController::class, 'follow']);
    Route::delete('/users/{id}/follow', [UserController::class, 'unfollow']);
    Route::get('/users/{id}/followers', [UserController::class, 'followers']);
    Route::get('/users/{id}/following', [UserController::class, 'following']);
    Route::get('/users/{userId}/posts', [PostController::class, 'byUser']);

    // Publicacoes e feeds.
    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/posts/feed', [PostController::class, 'feed']);
    Route::get('/posts/{id}', [PostController::class, 'show']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{id}', [PostController::class, 'update']);
    Route::delete('/posts/{id}', [PostController::class, 'destroy']);

    // Comentarios dentro de publicacoes e moderacao por admin.
    Route::get('/posts/{postId}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{postId}/comments', [CommentController::class, 'store']);
    Route::put('/comments/{id}', [CommentController::class, 'update']);
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']);

    // Bazes: reacoes nas publicacoes.
    Route::post('/posts/{postId}/bazes', [BazeController::class, 'store']);
    Route::delete('/posts/{postId}/bazes', [BazeController::class, 'destroy']);

    // Notificacoes do utilizador autenticado.
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
});
