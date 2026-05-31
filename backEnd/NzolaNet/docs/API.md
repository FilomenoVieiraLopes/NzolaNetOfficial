# Endpoints da API NzolaNet

Base URL local:

```text
http://127.0.0.1:8000/api
```

Formato padrao:

- requests comuns: `Content-Type: application/json`
- upload de ficheiros: `multipart/form-data`
- autenticacao: `Authorization: Bearer <token>`

## Respostas de erro

Formato comum:

```json
{
  "message": "Mensagem do erro"
}
```

Status frequentes:

- `200`: sucesso
- `201`: criado
- `401`: nao autenticado ou credenciais invalidas
- `403`: sem permissao
- `404`: recurso nao encontrado
- `422`: erro de validacao ou regra de negocio
- `500`: erro interno

## Autenticacao

### Registar utilizador

```http
POST /api/auth/register
```

Body:

```json
{
  "name": "Jurandy Salvador",
  "email": "jurandy@example.com",
  "password": "123456",
  "password_confirmation": "123456"
}
```

Resposta `201`:

```json
{
  "message": "Registo efectuado com sucesso.",
  "user": {
    "id": 1,
    "name": "Jurandy Salvador",
    "email": "jurandy@example.com"
  },
  "token": "1|token..."
}
```

Uso no Angular:

- guardar `token`;
- redirecionar para feed;
- enviar token nos proximos requests protegidos.

### Login

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "jurandy@example.com",
  "password": "123456"
}
```

Resposta `200`:

```json
{
  "message": "Login efectuado com sucesso.",
  "user": {
    "id": 1,
    "name": "Jurandy Salvador",
    "email": "jurandy@example.com"
  },
  "token": "1|token..."
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

Resposta `200`:

```json
{
  "message": "Sessao terminada com sucesso."
}
```

No Angular, remova o token guardado.

### Pedir recuperacao de senha

```http
POST /api/auth/forgot-password
```

Body:

```json
{
  "email": "jurandy@example.com"
}
```

Resposta `200`:

```json
{
  "message": "Se o email existir receberas instrucoes de recuperacao."
}
```

### Resetar senha

```http
POST /api/auth/reset-password
```

Body:

```json
{
  "email": "jurandy@example.com",
  "token": "token-recebido-por-email",
  "password": "novaSenha123",
  "password_confirmation": "novaSenha123"
}
```

Resposta `200`:

```json
{
  "message": "Senha alterada com sucesso."
}
```

## Utilizadores

Todos os endpoints desta seccao exigem:

```http
Authorization: Bearer <token>
```

### Ver perfil

```http
GET /api/users/{id}
```

Resposta `200`:

```json
{
  "id": 1,
  "name": "Jurandy",
  "email": "jurandy@example.com",
  "avatar_url": null,
  "bio": "Minha bio",
  "privacy": "public",
  "role": "user",
  "created_at": "2026-05-25 10:00:00"
}
```

Regra:

- perfil publico: visivel;
- perfil privado: visivel apenas ao dono ou seguidores.

### Atualizar perfil

```http
PUT /api/users/{id}
```

Body:

```json
{
  "name": "Novo nome",
  "bio": "Nova bio",
  "privacy": "private"
}
```

Campos opcionais:

- `name`
- `bio`
- `privacy`: `public` ou `private`

Resposta `200`:

```json
{
  "message": "Perfil actualizado com sucesso.",
  "user": {
    "id": 1,
    "name": "Novo nome",
    "privacy": "private"
  }
}
```

Regra:

- so o proprio utilizador pode editar o perfil.

### Atualizar avatar

```http
POST /api/users/{id}/avatar
Content-Type: multipart/form-data
```

Form data:

```text
avatar: ficheiro jpg, jpeg, png ou webp
```

Resposta `200`:

```json
{
  "message": "Avatar actualizado com sucesso.",
  "avatar_url": "http://127.0.0.1:8000/storage/avatars/file.png"
}
```

Regra:

- maximo 2 MB;
- so o proprio utilizador pode alterar.

### Seguir utilizador

```http
POST /api/users/{id}/follow
```

Resposta `200`:

```json
{
  "message": "Utilizador seguido com sucesso."
}
```

Regras:

- nao pode seguir a si mesmo;
- nao pode seguir o mesmo utilizador duas vezes;
- gera notificacao do tipo `follow`.

### Deixar de seguir

```http
DELETE /api/users/{id}/follow
```

Resposta `200`:

```json
{
  "message": "Deixaste de seguir o utilizador."
}
```

### Listar seguidores

```http
GET /api/users/{id}/followers
```

Resposta `200`:

```json
[
  {
    "id": 2,
    "name": "Maria",
    "email": "maria@example.com",
    "avatar_url": null,
    "bio": null,
    "privacy": "public",
    "role": "user",
    "created_at": "2026-05-25 10:00:00"
  }
]
```

### Listar quem o utilizador segue

```http
GET /api/users/{id}/following
```

Resposta `200`:

```json
[
  {
    "id": 3,
    "name": "Pedro",
    "email": "pedro@example.com"
  }
]
```

## Publicacoes

### Listar feed principal

```http
GET /api/posts
```

Resposta `200`:

```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "author_name": "Jurandy",
      "author_avatar": "",
      "user_id": 1,
      "content": "Minha publicacao",
      "image_url": null,
      "video_url": null,
      "bazes_count": 0,
      "comments_count": 0,
      "created_at": "2026-05-25 10:00:00"
    }
  ]
}
```

O Laravel devolve tambem metadados de paginacao (`links`, `total`, `per_page`, etc.).

### Listar feed de seguidos

```http
GET /api/posts/feed
```

Retorna publicacoes dos utilizadores que o autenticado segue.

### Ver uma publicacao

```http
GET /api/posts/{id}
```

Resposta `200`:

```json
{
  "id": 1,
  "author_name": "Jurandy",
  "author_avatar": "",
  "user_id": 1,
  "content": "Minha publicacao",
  "image_url": null,
  "video_url": null,
  "bazes_count": 0,
  "comments_count": 0,
  "created_at": "2026-05-25 10:00:00"
}
```

### Criar publicacao

```http
POST /api/posts
Content-Type: multipart/form-data
```

Form data:

```text
content: texto obrigatorio
image: ficheiro opcional jpg, jpeg, png ou webp
video: ficheiro opcional mp4, mov ou avi
```

Resposta `201`:

```json
{
  "message": "Publicacao criada com sucesso.",
  "post": {
    "id": 1,
    "content": "Texto da publicacao",
    "image_url": null,
    "video_url": null
  }
}
```

Limites:

- imagem ate 5 MB;
- video ate 50 MB;
- texto ate 2000 caracteres.

### Atualizar publicacao

```http
PUT /api/posts/{id}
```

Pode ser JSON para alterar apenas texto:

```json
{
  "content": "Texto atualizado"
}
```

Ou `multipart/form-data` para alterar texto/media.

Regra:

- apenas autor pode editar.

### Apagar publicacao

```http
DELETE /api/posts/{id}
```

Resposta `200`:

```json
{
  "message": "Publicacao eliminada com sucesso."
}
```

Regra:

- apenas autor pode apagar.

## Comentarios

### Listar comentarios de uma publicacao

```http
GET /api/posts/{postId}/comments
```

Resposta `200`:

```json
[
  {
    "id": 1,
    "post_id": 1,
    "user_id": 2,
    "author_name": "Maria",
    "author_avatar": null,
    "body": "Comentario",
    "created_at": "2026-05-25 10:05:00"
  }
]
```

### Criar comentario

```http
POST /api/posts/{postId}/comments
```

Body:

```json
{
  "body": "Gostei da publicacao"
}
```

Resposta `201`:

```json
{
  "message": "Comentario adicionado com sucesso.",
  "comment": {
    "id": 1,
    "body": "Gostei da publicacao"
  }
}
```

Regra:

- gera notificacao para o autor da publicacao se o comentario for de outra pessoa.

### Atualizar comentario

```http
PUT /api/comments/{id}
```

Body:

```json
{
  "body": "Comentario atualizado"
}
```

Regra:

- apenas autor pode editar.

### Apagar comentario

```http
DELETE /api/comments/{id}
```

Regra:

- autor pode apagar o proprio comentario;
- admin pode apagar qualquer comentario.

## Bazes

### Dar baze

```http
POST /api/posts/{postId}/bazes
```

Resposta `201`:

```json
{
  "message": "Baze dado com sucesso.",
  "baze": {
    "id": 1,
    "post_id": 1,
    "user_id": 2,
    "created_at": "2026-05-25 10:10:00"
  }
}
```

Regras:

- so pode dar um baze por publicacao;
- gera notificacao para o autor da publicacao se for outra pessoa.

### Remover baze

```http
DELETE /api/posts/{postId}/bazes
```

Resposta `200`:

```json
{
  "message": "Baze removido com sucesso."
}
```

## Notificacoes

### Listar notificacoes

```http
GET /api/notifications
```

Resposta `200`:

```json
[
  {
    "id": 1,
    "user_id": 1,
    "type": "comment",
    "related_id": 5,
    "read": false,
    "created_at": "2026-05-25 10:20:00"
  }
]
```

Tipos:

- `follow`
- `baze`
- `comment`

### Marcar uma notificacao como lida

```http
PUT /api/notifications/{id}/read
```

Resposta `200`:

```json
{
  "message": "Notificacao marcada como lida."
}
```

Regra:

- so o dono da notificacao pode marca-la como lida.

### Marcar todas como lidas

```http
PUT /api/notifications/read-all
```

Resposta `200`:

```json
{
  "message": "Todas as notificacoes marcadas como lidas."
}
```

## Ordem recomendada para testar manualmente

1. `POST /auth/register`
2. `POST /auth/login`
3. `POST /posts`
4. `GET /posts`
5. `POST /posts/{id}/comments`
6. `POST /posts/{id}/bazes`
7. `GET /notifications`
8. `PUT /notifications/{id}/read`
9. `PUT /users/{id}`
10. `POST /users/{id}/follow`

## Observacoes para uploads

Para `avatar`, `image` e `video`, use `FormData` no Angular. Nao envie `Content-Type: application/json` nesses requests. O browser define automaticamente o `Content-Type` com o boundary correto.
