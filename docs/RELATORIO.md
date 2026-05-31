# Relatorio do Projecto NzolaNet

## 1. Introducao

NzolaNet e uma aplicacao web de rede social desenvolvida para permitir registo de utilizadores, publicacao de conteudos, interacao por bazes e comentarios, gestao de perfil, feed de noticias e notificacoes.

O projecto segue o enunciado de AW, usando Angular no frontend, Laravel no backend e uma arquitetura por camadas com Controllers, Services, Repositories e DTOs.

## 2. Objetivos

- Permitir registo, login e recuperacao de senha.
- Permitir edicao de perfil e alteracao da foto.
- Permitir seguir e deixar de seguir utilizadores.
- Permitir criar, editar e apagar publicacoes.
- Permitir upload de imagens e videos nas publicacoes.
- Permitir dar e remover bazes, impedindo duplicacao.
- Permitir comentar, editar e apagar comentarios.
- Apresentar feed geral e feed de utilizadores seguidos.
- Gerar notificacoes para bazes, comentarios e novos seguidores.

## 3. Tecnologias

- Frontend: Angular 19.
- Backend: PHP Laravel 13.
- Autenticacao: Laravel Sanctum.
- Base de dados: configuravel por `.env`, com suporte a MySQL.
- Arquitetura: Controllers, Services, Repositories, DTOs e Models.

## 4. Arquitetura

O backend esta separado em camadas:

- Controllers: recebem requests, validam entrada e devolvem respostas HTTP.
- Services: concentram regras de negocio, como permissao, privacidade e notificacoes.
- Repositories: fazem acesso aos models e base de dados.
- DTOs: padronizam o formato enviado ao frontend.
- Models: representam entidades como User, Post, Comment, Baze, Follow e Notification.

O frontend Angular usa:

- Components para telas.
- Services para chamadas HTTP.
- Guards para proteger rotas autenticadas.
- Interceptor para enviar `Authorization: Bearer <token>`.
- Models TypeScript alinhados com os DTOs do backend.

## 5. Funcionalidades Implementadas

### Utilizadores

- Registo.
- Login/logout.
- Recuperacao e redefinicao de senha.
- Edicao de nome, bio e privacidade.
- Upload de avatar.
- Seguir/deixar de seguir.
- Pesquisa de utilizadores por nome/email.

### Publicacoes

- Criar publicacao com texto.
- Upload de imagem.
- Upload de video.
- Editar publicacao propria.
- Apagar publicacao propria.
- Administrador pode editar/apagar publicacoes.
- Listagem cronologica.
- Perfil mostra publicacoes do utilizador.

### Bazes

- Dar baze.
- Remover baze.
- Impedir multiplos bazes do mesmo utilizador.
- Retornar `has_bazed` para controlar o estado do botao no frontend.

### Comentarios

- Criar comentario.
- Editar comentario proprio.
- Apagar comentario proprio.
- Administrador pode apagar comentarios.
- Listagem por publicacao.

### Feed

- Feed geral com publicacoes recentes.
- Feed de utilizadores seguidos.
- Alternancia visual entre feed geral e seguindo no Angular.

### Notificacoes

- Criadas quando ha follow, baze ou comentario.
- Resposta enriquecida com actor, avatar, post relacionado e resumo do post.
- Clique em notificacao de post abre a tela da publicacao/comentarios.

## 6. Regras de Negocio

- Apenas utilizadores autenticados acessam rotas protegidas.
- Apenas o autor edita/apaga seus posts, exceto administrador.
- Apenas o autor edita seus comentarios.
- Autor ou administrador podem apagar comentarios.
- Um utilizador so pode dar um baze por publicacao.
- Perfil privado so pode ser visto pelo dono ou por seguidores.
- Notificacoes nao podem ser marcadas por outro utilizador.

## 7. Como Executar

Backend:

```bash
cd nzolanet-api
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
```

Frontend:

```bash
cd nzolanet-api/Frontend
npm install
npm start
```

URLs:

- API: `http://127.0.0.1:8000/api`
- Angular: `http://127.0.0.1:4200`

## 8. Integracao Frontend/Backend

O Angular envia o token Sanctum em todas as chamadas protegidas:

```http
Authorization: Bearer <token>
```

A URL base fica em:

```ts
Frontend/src/environments/environment.ts
```

## 9. Endpoints Principais

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/posts`
- `GET /api/posts/feed`
- `GET /api/users/{id}/posts`
- `POST /api/posts`
- `PUT /api/posts/{id}`
- `DELETE /api/posts/{id}`
- `POST /api/posts/{id}/bazes`
- `DELETE /api/posts/{id}/bazes`
- `GET /api/posts/{id}/comments`
- `POST /api/posts/{id}/comments`
- `PUT /api/comments/{id}`
- `DELETE /api/comments/{id}`
- `GET /api/users/search?q=nome`
- `GET /api/notifications`

## 10. Conclusao

O projecto cumpre os requisitos principais do enunciado: gestao de utilizadores, publicacoes, bazes, comentarios, feed e notificacoes. A aplicacao esta separada em camadas no backend e integrada ao frontend Angular por services HTTP, models tipados e interceptor de autenticacao.
