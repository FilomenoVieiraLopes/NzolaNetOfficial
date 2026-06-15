# NzolaNet

NzolaNet e uma aplicacao web de rede social feita para o projecto de Aplicacoes Web. O sistema permite gerir utilizadores, publicacoes, bazes, comentarios, seguidores, feed de noticias, perfis publicos/privados e notificacoes em tempo real.

Este repositorio esta organizado como monorepo:

- [backend/](backend/) - API Laravel, regras de negocio, banco de dados, autenticacao, notificacoes e WebSockets.
- [Frontend/](Frontend/) - aplicacao Angular que consome a API.

## Estado actual

Funcionalidades ja implementadas:

- Registo, login, logout e recuperacao de senha.
- Autenticacao por token com Laravel Sanctum.
- Edicao de perfil, foto de perfil, capa, bio e privacidade.
- Perfis publicos e privados com pedidos de seguimento.
- Seguir/deixar de seguir utilizadores.
- Feed geral e feed de pessoas seguidas.
- Scroll continuo no feed.
- Criar, editar e apagar publicacoes proprias.
- Admin pode moderar conteudo quando aplicavel.
- Upload e visualizacao de imagem/video em publicacoes.
- Comentarios inline, abertos directamente no post.
- Criar, editar e apagar comentarios.
- Dar/remover bazes em publicacoes e comentarios.
- Coracao vermelho quando o utilizador ja deu baze.
- Pesquisa de utilizadores.
- Sugestoes de perfis no home.
- Notificacoes para baze, comentario e novo seguidor.
- Apagar notificacoes.
- Actualizacao dinamica com Laravel Reverb/WebSockets.
- Feedback visual com sistema de toast no frontend.
- Testes automatizados dos principais endpoints do backend.

## Requisitos

Backend:

- PHP 8.3+
- Composer
- MySQL
- Laravel Reverb
- Node.js e npm, usados pelo Vite/scripts do Laravel

Frontend:

- Node.js 20+
- npm
- Angular CLI, opcional porque o projecto pode ser executado com `npm start`

## Execucao rapida

1. Preparar o backend:

```bash
cd backend
composer install
npm install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
```

2. Subir backend, queue e Reverb:

```bash
composer run dev
```

Se preferir controlar cada processo separadamente:

```bash
php artisan serve
php artisan reverb:start --debug
php artisan queue:listen --tries=1 --timeout=0
```

3. Preparar e executar o frontend:

```bash
cd ../Frontend
npm install
npm start
```

URLs principais:

- Frontend: `http://localhost:4200`
- API: `http://127.0.0.1:8000/api`
- Reverb: `ws://127.0.0.1:8080`

## Documentacao

- Backend: [backend/README.md](backend/README.md)
- Frontend: [Frontend/README.md](Frontend/README.md)
- Arquitectura: [backend/docs/ARCHITECTURE.md](backend/docs/ARCHITECTURE.md)
- Endpoints: [backend/docs/API.md](backend/docs/API.md)
- Integracao Angular/API: [backend/docs/ANGULAR.md](backend/docs/ANGULAR.md)

## Validacao

Backend:

```bash
cd backend
php artisan test
```

Frontend:

```bash
cd Frontend
npm run build
```

O build do Angular pode mostrar aviso de tamanho do bundle inicial. Esse aviso nao impede a geracao da aplicacao.
