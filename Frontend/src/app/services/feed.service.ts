import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { Comment } from '../models/comment.model';
import { Post } from '../models/post.model';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface LaravelPaginator<T> {
  data: T[];
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

  getPosts(): Observable<ApiResponse<Post[]>> {
    return this.loadPosts('/posts');
  }

  getFollowingFeed(): Observable<ApiResponse<Post[]>> {
    return this.loadPosts('/posts/feed');
  }

  getUserPosts(userId: number | string): Observable<ApiResponse<Post[]>> {
    return this.loadPosts(`/users/${userId}/posts`);
  }

  private loadPosts(path: string): Observable<ApiResponse<Post[]>> {
    return this.http.get<LaravelPaginator<Post>>(`${API_BASE_URL}${path}`).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.data,
        message: 'Publicacoes carregadas.'
      }))
    );
  }

  getPost(id: number): Observable<ApiResponse<Post>> {
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
}
