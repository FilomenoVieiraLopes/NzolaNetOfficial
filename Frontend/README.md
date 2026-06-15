# NzolaNet Frontend

Aplicacao Angular da rede social NzolaNet. Este frontend consome a API Laravel, guarda a sessao do utilizador, apresenta o feed, perfis, comentarios, notificacoes e eventos em tempo real.

## Stack tecnica

- Angular
- TypeScript
- Tailwind CSS
- Angular Router
- HttpClient
- Laravel Echo + Pusher JS para Reverb/WebSockets

## Funcionalidades

- Login, registo e recuperacao de senha.
- Layout autenticado com navegacao lateral/mobile.
- Feed geral e feed de pessoas seguidas.
- Scroll continuo para carregar mais publicacoes.
- Criacao, edicao e remocao de publicacoes.
- Upload de imagem/video.
- Comentarios inline directamente no post.
- Edicao e remocao de comentarios.
- Bazes em publicacoes e comentarios.
- Coracao vermelho quando o utilizador ja deu baze.
- Pesquisa de utilizadores.
- Perfis publicos e privados.
- Pedidos de follow para perfis privados.
- Sugestoes de perfis na home.
- Notificacoes com sino no feed e pagina dedicada.
- Feedback visual com toasts.
- Actualizacao dinamica via Reverb.

## Configuracao

Instalar dependencias:

```bash
npm install
```

Configurar a API em [src/environments/environment.ts](src/environments/environment.ts):

```ts
export const environment = {
  apiBaseUrl: 'http://127.0.0.1:8000/api',
  reverb: {
    appKey: 'nzolanet-local-key',
    host: '127.0.0.1',
    port: 8080,
    scheme: 'http',
  },
};
```

Os valores de Reverb devem bater com o `.env` do backend.

## Executar

```bash
npm start
```

ou:

```bash
ng serve
```

A aplicacao fica em:

```text
http://localhost:4200
```

## Build

```bash
npm run build
```

O resultado fica em:

```text
dist/nzola-net
```

Pode aparecer aviso de tamanho do bundle inicial. Esse aviso nao impede o build.

## Ligacao com o backend

A ligacao principal acontece nos services:

- `src/app/services/auth.service.ts` - login, registo, logout e sessao.
- `src/app/services/feed.service.ts` - posts, comentarios e bazes.
- `src/app/services/user.service.ts` - perfis, pesquisa, seguidores e privacidade.
- `src/app/services/notification.service.ts` - notificacoes.
- `src/app/services/realtime.service.ts` - Reverb/WebSockets.

O interceptor:

- `src/app/interceptors/auth.interceptor.ts`

adiciona automaticamente:

```http
Authorization: Bearer <token>
```

Quando a API devolve `401`, a sessao local e limpa e o utilizador volta para o login.

## Criar uma nova pagina

1. Gerar componente:

```bash
ng generate component components/nome-da-pagina
```

2. Adicionar rota em `src/app/app.routes.ts`.

3. Criar/usar um service para chamar o backend.

4. Se a pagina for protegida, colocar dentro da rota `/app` para usar o layout autenticado e o `authGuard`.

## Boas praticas usadas

- Componentes chamam services, nao chamam URLs directamente.
- Services centralizam contratos da API.
- Toasts substituem `alert`, `confirm` e mensagens soltas no console.
- Estado local e actualizado depois de criar, editar, apagar, comentar ou dar baze.
- Eventos Reverb actualizam notificacoes e feed sem recarregar a pagina.
