# Guia de integracao com Angular

Este guia mostra como ligar um frontend Angular ao backend Laravel da NzolaNet.

Base local da API:

```ts
export const environment = {
  apiUrl: 'http://127.0.0.1:8000/api',
};
```

## Fluxo geral

1. Utilizador faz registo ou login.
2. Backend devolve `token` e `user`.
3. Angular guarda o token.
4. Um interceptor adiciona `Authorization: Bearer <token>` nos requests protegidos.
5. Components chamam services Angular.
6. Services Angular consomem endpoints Laravel.

## Interfaces TypeScript

Crie, por exemplo:

```text
src/app/core/models/nzolanet.models.ts
```

```ts
export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  privacy: 'public' | 'private';
  role: 'user' | 'admin';
  created_at: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Post {
  id: number;
  author_name: string;
  author_avatar: string;
  user_id: number;
  content: string;
  image_url: string | null;
  video_url: string | null;
  bazes_count: number;
  comments_count: number;
  created_at: string;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  author_name: string;
  author_avatar: string | null;
  body: string;
  created_at: string;
}

export interface Baze {
  id: number;
  post_id: number;
  user_id: number;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'baze' | 'comment' | 'follow';
  related_id: number;
  read: boolean;
  created_at: string;
}
```

## AuthService

Exemplo:

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models/nzolanet.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly tokenKey = 'nzolanet_token';
  private readonly userKey = 'nzolanet_user';

  register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data)
      .pipe(tap(response => this.saveSession(response)));
  }

  login(data: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, data)
      .pipe(tap(response => this.saveSession(response)));
  }

  logout() {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/logout`, {})
      .pipe(tap(() => this.clearSession()));
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(data: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, data);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) as User : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}
```

## Interceptor para token

Angular moderno com functional interceptor:

```ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('nzolanet_token');

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};
```

Registar no `app.config.ts`:

```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

## Auth guard

```ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
```

Use em rotas protegidas:

```ts
{
  path: 'feed',
  canActivate: [authGuard],
  loadComponent: () => import('./features/feed/feed.component').then(m => m.FeedComponent),
}
```

## PostService

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, Post } from '../models/nzolanet.models';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAll(page = 1) {
    return this.http.get<PaginatedResponse<Post>>(`${this.apiUrl}/posts?page=${page}`);
  }

  getFeed(page = 1) {
    return this.http.get<PaginatedResponse<Post>>(`${this.apiUrl}/posts/feed?page=${page}`);
  }

  getById(id: number) {
    return this.http.get<Post>(`${this.apiUrl}/posts/${id}`);
  }

  create(data: { content: string; image?: File | null; video?: File | null }) {
    const form = new FormData();
    form.append('content', data.content);

    if (data.image) {
      form.append('image', data.image);
    }

    if (data.video) {
      form.append('video', data.video);
    }

    return this.http.post<{ message: string; post: Post }>(`${this.apiUrl}/posts`, form);
  }

  update(id: number, data: { content?: string; image?: File | null; video?: File | null }) {
    const form = new FormData();

    if (data.content !== undefined) {
      form.append('content', data.content);
    }

    if (data.image) {
      form.append('image', data.image);
    }

    if (data.video) {
      form.append('video', data.video);
    }

    return this.http.post<{ message: string; post: Post }>(
      `${this.apiUrl}/posts/${id}?_method=PUT`,
      form
    );
  }

  delete(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/posts/${id}`);
  }
}
```

Nota sobre update com ficheiro:

- Laravel suporta `PUT`, mas browsers e servidores lidam melhor com upload usando `POST + _method=PUT`.
- Para update sem ficheiro, pode usar `http.put(...)` com JSON.

## UserService

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { User } from '../models/nzolanet.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProfile(id: number) {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateProfile(id: number, data: Partial<Pick<User, 'name' | 'bio' | 'privacy'>>) {
    return this.http.put<{ message: string; user: User }>(`${this.apiUrl}/users/${id}`, data);
  }

  updateAvatar(id: number, avatar: File) {
    const form = new FormData();
    form.append('avatar', avatar);

    return this.http.post<{ message: string; avatar_url: string }>(
      `${this.apiUrl}/users/${id}/avatar`,
      form
    );
  }

  follow(id: number) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/users/${id}/follow`, {});
  }

  unfollow(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id}/follow`);
  }

  followers(id: number) {
    return this.http.get<User[]>(`${this.apiUrl}/users/${id}/followers`);
  }

  following(id: number) {
    return this.http.get<User[]>(`${this.apiUrl}/users/${id}/following`);
  }
}
```

## CommentService

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Comment } from '../models/nzolanet.models';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getByPost(postId: number) {
    return this.http.get<Comment[]>(`${this.apiUrl}/posts/${postId}/comments`);
  }

  create(postId: number, body: string) {
    return this.http.post<{ message: string; comment: Comment }>(
      `${this.apiUrl}/posts/${postId}/comments`,
      { body }
    );
  }

  update(id: number, body: string) {
    return this.http.put<{ message: string; comment: Comment }>(
      `${this.apiUrl}/comments/${id}`,
      { body }
    );
  }

  delete(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/comments/${id}`);
  }
}
```

## BazeService

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Baze } from '../models/nzolanet.models';

@Injectable({ providedIn: 'root' })
export class BazeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  give(postId: number) {
    return this.http.post<{ message: string; baze: Baze }>(
      `${this.apiUrl}/posts/${postId}/bazes`,
      {}
    );
  }

  remove(postId: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/posts/${postId}/bazes`);
  }
}
```

## NotificationService

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/nzolanet.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  list() {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications`);
  }

  markAsRead(id: number) {
    return this.http.put<{ message: string }>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllAsRead() {
    return this.http.put<{ message: string }>(`${this.apiUrl}/notifications/read-all`, {});
  }
}
```

## Exemplo de componente de feed

```ts
import { Component, inject, signal } from '@angular/core';
import { Post } from '../../core/models/nzolanet.models';
import { PostService } from '../../core/services/post.service';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
})
export class FeedComponent {
  private readonly postsService = inject(PostService);

  posts = signal<Post[]>([]);
  loading = signal(false);
  page = signal(1);

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.loading.set(true);

    this.postsService.getAll(this.page()).subscribe({
      next: response => {
        this.posts.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
```

Template simples:

```html
<section>
  @if (loading()) {
    <p>A carregar...</p>
  }

  @for (post of posts(); track post.id) {
    <article>
      <header>
        <img [src]="post.author_avatar || 'assets/default-avatar.png'" alt="" />
        <strong>{{ post.author_name }}</strong>
        <time>{{ post.created_at }}</time>
      </header>

      <p>{{ post.content }}</p>

      @if (post.image_url) {
        <img [src]="post.image_url" alt="Imagem da publicacao" />
      }

      @if (post.video_url) {
        <video [src]="post.video_url" controls></video>
      }

      <footer>
        <span>{{ post.bazes_count }} bazes</span>
        <span>{{ post.comments_count }} comentarios</span>
      </footer>
    </article>
  }
</section>
```

## Tratamento de erros

Crie um helper ou trate no `subscribe`:

```ts
this.authService.login(form).subscribe({
  next: () => this.router.navigate(['/feed']),
  error: error => {
    const message = error.error?.message ?? 'Erro inesperado';
    this.errorMessage.set(message);
  },
});
```

Erros comuns:

- `401`: token ausente, expirado ou login invalido.
- `403`: utilizador sem permissao.
- `404`: recurso nao encontrado.
- `422`: validacao falhou ou regra de negocio violada.

## Upload de imagem/video

No HTML:

```html
<input type="file" accept="image/*" (change)="onImageSelected($event)" />
<input type="file" accept="video/mp4,video/quicktime,video/x-msvideo" (change)="onVideoSelected($event)" />
```

No component:

```ts
selectedImage: File | null = null;
selectedVideo: File | null = null;

onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  this.selectedImage = input.files?.[0] ?? null;
}

onVideoSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  this.selectedVideo = input.files?.[0] ?? null;
}

submitPost(content: string) {
  this.postService.create({
    content,
    image: this.selectedImage,
    video: this.selectedVideo,
  }).subscribe();
}
```

## CORS

Se o Angular estiver em `http://localhost:4200` e Laravel em `http://127.0.0.1:8000`, confirme a configuracao de CORS do Laravel.

Em desenvolvimento, normalmente o Laravel aceita chamadas API se `config/cors.php` estiver configurado. Se encontrar erro CORS no browser:

- confirme a URL da API;
- confirme que o backend esta ligado;
- confirme que o endpoint existe;
- configure as origens permitidas para `http://localhost:4200`.

## Ordem sugerida para construir o frontend

1. Criar layout base e rotas Angular.
2. Criar `AuthService`, interceptor e guard.
3. Criar paginas de login/registo.
4. Criar feed principal.
5. Criar formulario de publicacao com upload.
6. Criar comentarios e bazes nos cards de publicacao.
7. Criar perfil do utilizador.
8. Criar follow/unfollow.
9. Criar notificacoes.
10. Criar visoes de admin para moderar comentarios, se necessario.

## Cuidados importantes

- Nao envie token manualmente em cada service; use interceptor.
- Nao defina `Content-Type` manualmente em requests `FormData`.
- Use `image_url` e `video_url` diretamente no template.
- Respeite `privacy` no frontend, mas mantenha a regra tambem no backend.
- Verifique `role === 'admin'` para mostrar botoes de moderacao.
- Trate `403` e `422` com mensagens claras para o utilizador.
# Atualizacao do Frontend Angular

O frontend Angular ja consome a API Laravel atraves de:

- `AuthService`: login, registo, logout, recuperar senha e redefinir senha.
- `FeedService`: feed geral, feed seguindo, posts do perfil, criar/editar/apagar posts, comentarios e bazes.
- `UserService`: perfil, avatar, follow/unfollow e pesquisa.
- `NotificationService`: listar e marcar notificacoes.

Rotas relevantes:

```txt
/login
/registrar
/recuperar-senha
/redefinir-senha
/app/home
/app/perfil
/app/editar-perfil
/app/pesquisar
/app/notificacoes
/app/criar-post
/app/comentario
```

O token e enviado automaticamente pelo interceptor:

```ts
Authorization: Bearer <token>
```

Para executar:

```bash
cd Frontend
npm install
npm start
```
