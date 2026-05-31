# Guia visual para testar os endpoints da NzolaNet

Este guia mostra uma forma organizada de testar a API NzolaNet do inicio ao fim, simulando o fluxo real de uso da aplicacao.

> Base URL local

```text
http://127.0.0.1:8000/api
```

## Preparar o ambiente

Antes de testar:

```bash
php artisan migrate
php artisan storage:link
php artisan serve
```

No Postman, Insomnia ou Thunder Client, cria estas variaveis:

| Variavel | Valor inicial | Uso |
|---|---:|---|
| `base_url` | `http://127.0.0.1:8000/api` | URL base da API |
| `token` | vazio | Token do User 1 |
| `user_id` | vazio | ID do User 1 |
| `token2` | vazio | Token do User 2 |
| `user2_id` | vazio | ID do User 2 |
| `post_id` | vazio | ID da publicacao criada |
| `comment_id` | vazio | ID do comentario criado |
| `notification_id` | vazio | ID da notificacao |

## Mapa geral dos testes

```text
1. Auth
   -> criar User 1
   -> criar User 2
   -> login

2. Perfil
   -> ver perfil
   -> editar perfil
   -> testar privacidade
   -> avatar

3. Social
   -> seguir
   -> ver followers
   -> ver following
   -> deixar de seguir

4. Publicacoes
   -> criar post
   -> listar posts
   -> ver post
   -> editar post

5. Interacoes
   -> comentar
   -> listar comentarios
   -> editar comentario
   -> dar baze
   -> remover baze

6. Notificacoes
   -> listar
   -> marcar uma como lida
   -> marcar todas como lidas

7. Limpeza
   -> apagar comentario
   -> apagar post
   -> logout
```

## Headers importantes

### Requests JSON

```http
Accept: application/json
Content-Type: application/json
```

### Requests autenticados

```http
Authorization: Bearer {{token}}
```

### Uploads

Para avatar, imagem ou video, usa `multipart/form-data`.

Nao defina manualmente `Content-Type` quando usar `FormData`; o cliente HTTP define automaticamente.

## Fluxo recomendado

### 1. Criar o primeiro utilizador

```http
POST {{base_url}}/auth/register
```

```json
{
  "name": "User One",
  "email": "user1@example.com",
  "password": "123456",
  "password_confirmation": "123456"
}
```

Esperado:

```text
201 Created
```

Guardar:

- `token` com o valor de `response.token`
- `user_id` com o valor de `response.user.id`

### 2. Criar o segundo utilizador

```http
POST {{base_url}}/auth/register
```

```json
{
  "name": "User Two",
  "email": "user2@example.com",
  "password": "123456",
  "password_confirmation": "123456"
}
```

Guardar:

- `token2`
- `user2_id`

### 3. Fazer login

```http
POST {{base_url}}/auth/login
```

```json
{
  "email": "user1@example.com",
  "password": "123456"
}
```

Esperado:

```text
200 OK
```

## Testes de perfil

### Ver perfil

```http
GET {{base_url}}/users/{{user_id}}
Authorization: Bearer {{token}}
```

Confirma se a resposta traz:

- `id`
- `name`
- `email`
- `privacy`
- `role`

### Atualizar perfil

```http
PUT {{base_url}}/users/{{user_id}}
Authorization: Bearer {{token}}
```

```json
{
  "name": "User One Updated",
  "bio": "Minha bio na NzolaNet",
  "privacy": "public"
}
```

Esperado:

```text
200 OK
```

### Testar perfil privado

Atualiza o User 1 para privado:

```json
{
  "privacy": "private"
}
```

Depois tenta ver o perfil com `token2`:

```http
GET {{base_url}}/users/{{user_id}}
Authorization: Bearer {{token2}}
```

Esperado:

```text
403 Forbidden
```

Agora o User 2 segue o User 1:

```http
POST {{base_url}}/users/{{user_id}}/follow
Authorization: Bearer {{token2}}
```

Depois tenta ver o perfil privado de novo com `token2`.

Esperado:

```text
200 OK
```

### Atualizar avatar

```http
POST {{base_url}}/users/{{user_id}}/avatar
Authorization: Bearer {{token}}
```

Body `form-data`:

| Key | Type | Value |
|---|---|---|
| `avatar` | File | imagem `.jpg`, `.jpeg`, `.png` ou `.webp` |

Esperado:

```text
200 OK
```

## Testes sociais

### Seguir utilizador

```http
POST {{base_url}}/users/{{user_id}}/follow
Authorization: Bearer {{token2}}
```

Esperado:

```text
200 OK
```

### Ver seguidores

```http
GET {{base_url}}/users/{{user_id}}/followers
Authorization: Bearer {{token}}
```

### Ver quem o User 2 segue

```http
GET {{base_url}}/users/{{user2_id}}/following
Authorization: Bearer {{token2}}
```

### Deixar de seguir

```http
DELETE {{base_url}}/users/{{user_id}}/follow
Authorization: Bearer {{token2}}
```

## Testes de publicacoes

### Criar publicacao

```http
POST {{base_url}}/posts
Authorization: Bearer {{token}}
```

Body `form-data`:

| Key | Type | Value |
|---|---|---|
| `content` | Text | `Minha primeira publicacao` |
| `image` | File | opcional |
| `video` | File | opcional |

Esperado:

```text
201 Created
```

Guardar:

- `post_id` com `response.post.id`

### Listar publicacoes

```http
GET {{base_url}}/posts
Authorization: Bearer {{token}}
```

Confirma se a resposta traz:

- `data`
- `current_page`
- `total`
- `per_page`

### Ver uma publicacao

```http
GET {{base_url}}/posts/{{post_id}}
Authorization: Bearer {{token}}
```

### Atualizar publicacao

Para texto:

```http
PUT {{base_url}}/posts/{{post_id}}
Authorization: Bearer {{token}}
```

```json
{
  "content": "Publicacao atualizada"
}
```

Para texto com imagem/video:

```http
POST {{base_url}}/posts/{{post_id}}?_method=PUT
Authorization: Bearer {{token}}
```

Body `form-data`:

| Key | Type | Value |
|---|---|---|
| `content` | Text | `Publicacao atualizada com media` |
| `image` | File | opcional |
| `video` | File | opcional |

## Testes de comentarios

### Criar comentario

Usa `token2` para comentar no post do User 1.

```http
POST {{base_url}}/posts/{{post_id}}/comments
Authorization: Bearer {{token2}}
```

```json
{
  "body": "Gostei desta publicacao"
}
```

Esperado:

```text
201 Created
```

Guardar:

- `comment_id` com `response.comment.id`

### Listar comentarios

```http
GET {{base_url}}/posts/{{post_id}}/comments
Authorization: Bearer {{token}}
```

### Atualizar comentario

```http
PUT {{base_url}}/comments/{{comment_id}}
Authorization: Bearer {{token2}}
```

```json
{
  "body": "Comentario atualizado"
}
```

### Apagar comentario

```http
DELETE {{base_url}}/comments/{{comment_id}}
Authorization: Bearer {{token2}}
```

## Testes de bazes

### Dar baze

```http
POST {{base_url}}/posts/{{post_id}}/bazes
Authorization: Bearer {{token2}}
```

Esperado:

```text
201 Created
```

### Testar baze duplicado

Executa o mesmo request de dar baze outra vez.

Esperado:

```text
422 Unprocessable Entity
```

### Remover baze

```http
DELETE {{base_url}}/posts/{{post_id}}/bazes
Authorization: Bearer {{token2}}
```

Esperado:

```text
200 OK
```

## Testes de notificacoes

As notificacoes aparecem para o User 1 quando User 2:

- segue User 1;
- comenta num post de User 1;
- da baze num post de User 1.

### Listar notificacoes

```http
GET {{base_url}}/notifications
Authorization: Bearer {{token}}
```

Guardar:

- `notification_id` com o primeiro `response[0].id`

### Marcar uma notificacao como lida

```http
PUT {{base_url}}/notifications/{{notification_id}}/read
Authorization: Bearer {{token}}
```

Esperado:

```text
200 OK
```

### Marcar todas como lidas

```http
PUT {{base_url}}/notifications/read-all
Authorization: Bearer {{token}}
```

## Testes de seguranca e permissao

Estes testes confirmam que a API bloqueia operacoes indevidas.

| Cenario | Como testar | Esperado |
|---|---|---|
| Sem token | Chamar `GET /posts` sem Authorization | `401` |
| Login errado | Senha incorreta em `/auth/login` | `401` |
| Editar post alheio | User 2 tenta editar post do User 1 | `403` |
| Apagar comentario alheio | User 1 tenta apagar comentario do User 2 | `403`, exceto se for admin |
| Perfil privado | User 2 ve User 1 privado sem seguir | `403` |
| Baze duplicado | User 2 da baze duas vezes | `422` |
| Recurso inexistente | `GET /posts/999999` | `404` |
| Comentarios de post inexistente | `GET /posts/999999/comments` | `404` |

## Checklist final

Marca cada item depois de testar.

```text
[ ] Registo User 1
[ ] Registo User 2
[ ] Login
[ ] Logout
[ ] Forgot password
[ ] Reset password invalido
[ ] Ver perfil
[ ] Atualizar perfil
[ ] Perfil privado bloqueia estranho
[ ] Perfil privado permite seguidor
[ ] Atualizar avatar
[ ] Seguir utilizador
[ ] Deixar de seguir
[ ] Listar followers
[ ] Listar following
[ ] Criar publicacao
[ ] Listar publicacoes
[ ] Ver publicacao
[ ] Atualizar publicacao
[ ] Apagar publicacao
[ ] Criar comentario
[ ] Listar comentarios
[ ] Atualizar comentario
[ ] Apagar comentario
[ ] Dar baze
[ ] Impedir baze duplicado
[ ] Remover baze
[ ] Listar notificacoes
[ ] Marcar uma notificacao como lida
[ ] Marcar todas notificacoes como lidas
[ ] Testar 401 sem token
[ ] Testar 403 sem permissao
[ ] Testar 404 recurso inexistente
[ ] Testar 422 regra violada
```

## Resultado esperado

Se tudo estiver correto:

- todos os endpoints protegidos exigem token;
- User 1 consegue gerir o proprio perfil e posts;
- User 2 consegue seguir, comentar e dar baze;
- User 1 recebe notificacoes;
- User 2 nao consegue editar/apagar conteudo de User 1;
- perfil privado bloqueia quem nao segue;
- uploads devolvem URLs publicas em `/storage/...`.
