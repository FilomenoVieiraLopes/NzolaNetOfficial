import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, LaravelPaginator } from '../models/api-response.model';
import { Comment } from '../models/comment.model';
import { Post } from '../models/post.model';

interface PostCreateResponse {
  message: string;
  post: Post;
}

interface CommentCreateResponse {
  message: string;
  comment: Comment;
}

interface PostMutationResponse {
  message: string;
  post: Post;
}

interface CommentMutationResponse {
  message: string;
  comment: Comment;
}

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getPosts(): Observable<ApiResponse<Post[]>> {
    return this.loadPosts('/posts');
  }

  getFollowingFeed(): Observable<ApiResponse<Post[]>> {
    return this.loadPosts('/posts/feed');
  }

  getUserPosts(userId: number): Observable<ApiResponse<Post[]>> {
    return this.loadPosts(`/users/${userId}/posts`);
  }

  private loadPosts(path: string): Observable<ApiResponse<Post[]>> {
    return this.http.get<LaravelPaginator<Post>>(`${this.apiUrl}${path}`).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.data,
        message: 'Posts carregados com sucesso.'
      }))
    );
  }

  getPost(id: number): Observable<ApiResponse<Post>> {
    return this.http.get<Post>(`${this.apiUrl}/posts/${id}`).pipe(
      switchMap((post) => this.getComments(id).pipe(
        map((commentsResponse) => ({
          status: 'success' as const,
          data: {
            ...post,
            comments: commentsResponse.data
          },
          message: 'Publicacao carregada com sucesso.'
        }))
      ))
    );
  }

  createPost(data: { content: string; image?: File | null; video?: File | null }): Observable<ApiResponse<Post>> {
    const formData = new FormData();
    formData.append('content', data.content);

    if (data.image) {
      formData.append('image', data.image);
    }

    if (data.video) {
      formData.append('video', data.video);
    }

    return this.http.post<PostCreateResponse>(`${this.apiUrl}/posts`, formData).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.post,
        message: response.message
      }))
    );
  }

  getComments(postId: number): Observable<ApiResponse<Comment[]>> {
    return this.http.get<Comment[]>(`${this.apiUrl}/posts/${postId}/comments`).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response,
        message: 'Comentarios carregados com sucesso.'
      }))
    );
  }

  addComment(postId: number, body: string): Observable<ApiResponse<Comment>> {
    return this.http.post<CommentCreateResponse>(`${this.apiUrl}/posts/${postId}/comments`, { body }).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.comment,
        message: response.message
      }))
    );
  }

  updatePost(postId: number, content: string): Observable<ApiResponse<Post>> {
    return this.http.put<PostMutationResponse>(`${this.apiUrl}/posts/${postId}`, { content }).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.post,
        message: response.message
      }))
    );
  }

  deletePost(postId: number): Observable<ApiResponse<null>> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/posts/${postId}`).pipe(
      map((response) => ({
        status: 'success' as const,
        data: null,
        message: response.message
      }))
    );
  }

  updateComment(commentId: number, body: string): Observable<ApiResponse<Comment>> {
    return this.http.put<CommentMutationResponse>(`${this.apiUrl}/comments/${commentId}`, { body }).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.comment,
        message: response.message
      }))
    );
  }

  deleteComment(commentId: number): Observable<ApiResponse<null>> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/comments/${commentId}`).pipe(
      map((response) => ({
        status: 'success' as const,
        data: null,
        message: response.message
      }))
    );
  }

  giveBaze(postId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<{ message: string; baze: unknown }>(`${this.apiUrl}/posts/${postId}/bazes`, {}).pipe(
      map((response) => ({
        status: 'success' as const,
        data: response.baze,
        message: response.message
      }))
    );
  }

  removeBaze(postId: number): Observable<ApiResponse<null>> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/posts/${postId}/bazes`).pipe(
      map((response) => ({
        status: 'success' as const,
        data: null,
        message: response.message
      }))
    );
  }
}
