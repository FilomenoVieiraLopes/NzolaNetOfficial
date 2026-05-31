# Arquitetura e requisitos do NzolaNet

Este documento explica a implementacao tecnica do backend NzolaNet e relaciona cada parte com os requisitos do enunciado.

## Objetivo do sistema

NzolaNet e uma rede social onde utilizadores podem:

- criar conta e autenticar-se;
- manter um perfil pessoal;
- publicar conteudo com texto, imagem e video;
- interagir com publicacoes por comentarios e bazes;
- seguir outros utilizadores;
- receber notificacoes de interacoes;
- visualizar feed principal e feed de utilizadores seguidos.

## Arquitetura em camadas

O projeto segue separacao de responsabilidades:

```text
Request HTTP
   -> Route
   -> Controller
   -> Service
   -> Repository
   -> Model / Database
   -> DTO
   -> Response JSON
```

## Rotas

Arquivo:

```text
routes/api.php
```

Responsabilidade:

- define URLs da API;
- separa rotas publicas e protegidas;
- aplica `auth:sanctum` nas rotas que precisam de token;
- aponta cada endpoint para o controller correto.

Exemplo:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/posts', [PostController::class, 'store']);
});
```

## Controllers

Pasta:

```text
app/Http/Controllers
```

Responsabilidade:

- receber requests HTTP;
- validar dados de entrada;
- obter o utilizador autenticado quando necessario;
- chamar o service certo;
- devolver resposta JSON.

Controllers existentes:

- `AuthController`: registo, login, logout, recuperacao e reset de senha.
- `UserController`: perfil, avatar, follow/unfollow, followers/following.
- `PostController`: feed, CRUD de publicacoes e upload de media.
- `CommentController`: CRUD de comentarios e moderacao por admin.
- `BazeController`: dar/remover baze.
- `NotificationController`: listar e marcar notificacoes como lidas.

Regra importante: controller nao deve concentrar regra de negocio complexa. Essa logica fica nos services.

## Services

Pasta:

```text
app/Services
```

Responsabilidade:

- aplicar regras de negocio;
- verificar permissoes;
- coordenar repositories;
- gerar notificacoes;
- converter models para DTOs de resposta.

Services existentes:

- `AuthService`
- `UserService`
- `PostService`
- `CommentService`
- `BazeService`
- `NotificationService`

Exemplos de regras aplicadas nos services:

- um utilizador nao pode seguir a si proprio;
- nao pode dar dois bazes na mesma publicacao;
- apenas autor pode editar/apagar sua publicacao;
- apenas autor pode editar seu comentario;
- admin pode apagar comentario de qualquer utilizador;
- perfil privado so e visivel ao dono ou seguidores;
- notificacoes sao criadas quando alguem segue, comenta ou da baze.

## Repositories

Pasta:

```text
app/Repositories
```

Responsabilidade:

- encapsular consultas Eloquent;
- criar, atualizar e apagar registos;
- preparar queries com relacoes e contadores.

Repositories existentes:

- `UserRepository`
- `PostRepository`
- `CommentRepository`
- `BazeRepository`
- `FollowRepository`
- `NotificationRepository`

Exemplo:

`PostRepository` usa `withCount(['bazes', 'comments'])` para evitar consultas extras quando o frontend precisa mostrar quantidade de bazes e comentarios.

## Interfaces

Pastas:

```text
app/Interfaces/Repositories
app/Interfaces/Services
```

Responsabilidade:

- definir contratos;
- permitir injecao de dependencia;
- reduzir acoplamento entre controllers, services e repositories.

As interfaces sao ligadas as classes reais em:

```text
app/Providers/RepositoryServiceProvider.php
```

## DTOs

Pasta:

```text
app/DTOs
```

Responsabilidade:

- padronizar dados de entrada e saida;
- evitar expor models diretamente;
- garantir que o frontend receba sempre o mesmo formato.

Tipos de DTO:

- DTO de entrada: `CreatePostDTO`, `UpdateUserDTO`, `CreateCommentDTO`.
- DTO de resposta: `PostResponseDTO`, `UserResponseDTO`, `CommentResponseDTO`.

Exemplo de resposta de publicacao:

```json
{
  "id": 1,
  "author_name": "Jurandy",
  "author_avatar": "http://localhost/storage/avatars/a.png",
  "user_id": 1,
  "content": "Minha publicacao",
  "image_url": null,
  "video_url": null,
  "bazes_count": 3,
  "comments_count": 2,
  "created_at": "2026-05-25 10:00:00"
}
```

## Models

Pasta:

```text
app/Models
```

Responsabilidade:

- representar tabelas;
- definir campos preenchiveis;
- definir relacoes Eloquent.

Models:

- `User`
- `Post`
- `Comment`
- `Baze`
- `Follow`
- `Notification`

Relacoes principais:

- User tem muitas publicacoes.
- User tem muitos comentarios.
- Post pertence a User.
- Post tem muitos comentarios.
- Post tem muitos bazes.
- Follow liga follower a following.
- Notification pertence a User.

## Banco de dados

Migrations:

```text
database/migrations
```

Tabelas principais:

- `users`
- `posts`
- `comments`
- `bazes`
- `follows`
- `notifications`
- `personal_access_tokens`
- `password_reset_tokens`

Tabelas auxiliares:

- `cache`
- `cache_locks`
- `jobs`
- `job_batches`
- `failed_jobs`
- `sessions`

## Requisitos funcionais

### Utilizadores

Implementado:

- registo;
- login;
- logout;
- recuperacao de senha;
- reset de senha;
- edicao de perfil;
- alteracao de avatar;
- privacidade de perfil;
- seguir/deixar de seguir.

Arquivos principais:

- `AuthController`
- `UserController`
- `AuthService`
- `UserService`
- `UserRepository`
- `FollowRepository`

### Publicacoes

Implementado:

- criar publicacao;
- editar propria publicacao;
- apagar propria publicacao;
- texto obrigatorio;
- imagem opcional;
- video opcional;
- listar em ordem cronologica;
- mostrar nome/foto do autor;
- mostrar quantidade de bazes e comentarios.

Arquivos principais:

- `PostController`
- `PostService`
- `PostRepository`
- `PostResponseDTO`

### Bazes

Implementado:

- dar baze;
- remover baze;
- impedir duplicidade;
- contar bazes por publicacao;
- notificar autor do post.

Arquivos principais:

- `BazeController`
- `BazeService`
- `BazeRepository`

### Comentarios

Implementado:

- adicionar comentario;
- editar comentario proprio;
- apagar comentario proprio;
- admin pode apagar comentarios de terceiros;
- listar comentarios por publicacao;
- notificar autor do post.

Arquivos principais:

- `CommentController`
- `CommentService`
- `CommentRepository`

### Feed

Implementado:

- feed principal com publicacoes recentes;
- feed de publicacoes dos utilizadores seguidos;
- paginacao Laravel.

Arquivos principais:

- `PostController@index`
- `PostController@feed`
- `PostRepository@getAllPaginated`
- `PostRepository@getFeedForUser`

### Notificacoes

Implementado:

- notificacao quando recebe follow;
- notificacao quando recebe comment;
- notificacao quando recebe baze;
- listar notificacoes do utilizador autenticado;
- marcar uma notificacao como lida;
- marcar todas como lidas.

Arquivos principais:

- `NotificationController`
- `NotificationService`
- `NotificationRepository`

## Regras de negocio importantes

- Apenas utilizadores autenticados podem usar endpoints protegidos.
- Apenas o dono edita seu perfil.
- Apenas o dono altera seu avatar.
- Apenas o autor edita/apaga sua publicacao.
- Apenas o autor edita seu comentario.
- Admin pode apagar qualquer comentario.
- Um utilizador nao pode seguir a si mesmo.
- Um utilizador nao pode seguir o mesmo perfil duas vezes.
- Um utilizador nao pode dar dois bazes na mesma publicacao.
- Perfis privados sao acessiveis apenas pelo dono ou por seguidores.
- Utilizador nao pode marcar notificacoes de outro utilizador como lidas.

## Requisitos nao funcionais

### Seguranca

- API protegida com Laravel Sanctum.
- Senhas sao guardadas com hash.
- `.env` fica fora do Git.
- Uploads tem validacao de tipo e tamanho.
- Token precisa ser enviado no header `Authorization`.

### Performance

- Publicacoes usam paginacao.
- Contadores de bazes/comentarios usam `withCount`.
- Relacoes principais sao carregadas com `with`.

### Manutencao

- Camadas separadas.
- DTOs para padronizar respostas.
- Interfaces para reduzir acoplamento.
- Testes em `tests/Feature/NzolaNetApiTest.php`.

## Pontos para evoluir

- Criar frontend Angular completo.
- Adicionar refresh em tempo real do feed com polling ou WebSocket.
- Criar endpoints especificos de administracao se o projeto crescer.
- Adicionar pagina/relatorio do projeto.
- Adicionar documentacao Swagger/OpenAPI se necessario.
