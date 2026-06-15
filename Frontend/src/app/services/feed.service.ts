import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Comment } from '../models/comment.model';
import { Post } from '../models/post.model';

const API_BASE_URL = environment.apiBaseUrl;

interface LaravelPaginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface PostCreateResponse {
  message: string;
  post: Post;
}

interface CommentCreateResponse {
  message: string;
  comment: Comment;
}

interface CommentUpdateResponse {
  message: string;
  comment: Comment;
}

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private http = inject(HttpClient);

  getPosts(page = 1): Observable<ApiResponse<Post[]>> {
    return this.loadPosts('/posts', page);
  }

  getFollowingFeed(page = 1): Observable<ApiResponse<Post[]>> {
    return this.loadPosts('/posts/feed', page);
  }

  getUserPosts(userId: number | string, page = 1): Observable<ApiResponse<Post[]>> {
    return this.loadPosts(`/users/${userId}/posts`, page);
  }

  private loadPosts(path: string, page: number): Observable<ApiResponse<Post[]>> {
    // Normaliza a paginacao do Laravel para o formato usado pelos componentes Angular.
    return this.http.get<LaravelPaginator<Post>>(`${API_BASE_URL}${path}`, {
      params: { page }
    }).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.data,
        message: 'Publicacoes carregadas.',
        meta: {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total,
          from: response.from,
          to: response.to,
        }
      }))
    );
  }

  getPost(id: number): Observable<ApiResponse<Post>> {
    // O detalhe da publicacao precisa trazer tambem os comentarios associados.
    return this.http.get<Post>(`${API_BASE_URL}/posts/${id}`).pipe(
      switchMap((post) => this.getComments(id).pipe(
        map((commentsResponse) => ({
          status: 'success' as const,
          data: { ...post, comments: commentsResponse.data },
          message: 'Publicacao carregada.'
        }))
      ))
    );
  }

  createPost(data: { content: string; image?: File | null; video?: File | null }): Observable<ApiResponse<Post>> {
    // Sem ficheiros, enviamos JSON simples; com imagem/video, usamos FormData.
    if (!data.image && !data.video) {
      return this.http.post<PostCreateResponse>(`${API_BASE_URL}/posts`, {
        content: data.content.trim()
      }).pipe(
        map((response) => ({
          status: 'success' as const,
          data: response.post,
          message: response.message
        }))
      );
    }

    const formData = new FormData();
    formData.append('content', data.content.trim());

    if (data.image) {
      formData.append('image', data.image);
    }

    if (data.video) {
      formData.append('video', data.video);
    }

    return this.http.post<PostCreateResponse>(`${API_BASE_URL}/posts`, formData).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.post,
        message: response.message
      }))
    );
  }

  updatePost(postId: number, data: { content: string; image?: File | null; video?: File | null }): Observable<ApiResponse<Post>> {
    // Laravel aceita override de metodo quando o update tambem carrega ficheiros.
    if (!data.image && !data.video) {
      return this.http.put<PostCreateResponse>(`${API_BASE_URL}/posts/${postId}`, {
        content: data.content.trim()
      }).pipe(
        map((response) => ({
          status: 'success' as const,
          data: response.post,
          message: response.message
        }))
      );
    }

    const formData = new FormData();
    formData.append('content', data.content.trim());

    if (data.image) {
      formData.append('image', data.image);
    }

    if (data.video) {
      formData.append('video', data.video);
    }

    return this.http.post<PostCreateResponse>(`${API_BASE_URL}/posts/${postId}?_method=PUT`, formData).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.post,
        message: response.message
      }))
    );
  }

  deletePost(postId: number): Observable<ApiResponse<null>> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/posts/${postId}`).pipe(
      map((response) => ({
        status: 'success' as const,
        data: null,
        message: response.message
      }))
    );
  }

  getComments(postId: number): Observable<ApiResponse<Comment[]>> {
    return this.http.get<Comment[]>(`${API_BASE_URL}/posts/${postId}/comments`).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response,
        message: 'Comentarios carregados.'
      }))
    );
  }

  addComment(postId: number, body: string): Observable<ApiResponse<Comment>> {
    return this.http.post<CommentCreateResponse>(`${API_BASE_URL}/posts/${postId}/comments`, { body }).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.comment,
        message: response.message
      }))
    );
  }

  updateComment(commentId: number, body: string): Observable<ApiResponse<Comment>> {
    return this.http.put<CommentUpdateResponse>(`${API_BASE_URL}/comments/${commentId}`, { body }).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.comment,
        message: response.message
      }))
    );
  }

  deleteComment(commentId: number): Observable<ApiResponse<null>> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/comments/${commentId}`).pipe(
      map((response) => ({
        status: 'success' as const,
        data: null,
        message: response.message
      }))
    );
  }

  giveBaze(postId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<{ message: string; baze: unknown }>(`${API_BASE_URL}/posts/${postId}/bazes`, {}).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.baze,
        message: response.message
      }))
    );
  }

  removeBaze(postId: number): Observable<ApiResponse<null>> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/posts/${postId}/bazes`).pipe(
      map((response) => ({
        status: 'success' as const,
        data: null,
        message: response.message
      }))
    );
  }

  giveCommentBaze(commentId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<{ message: string; baze: unknown }>(`${API_BASE_URL}/comments/${commentId}/bazes`, {}).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.baze,
        message: response.message
      }))
    );
  }

  removeCommentBaze(commentId: number): Observable<ApiResponse<null>> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/comments/${commentId}/bazes`).pipe(
      map((response) => ({
        status: 'success' as const,
        data: null,
        message: response.message
      }))
    );
  }
}
