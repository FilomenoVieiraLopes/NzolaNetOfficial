import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

const API_BASE_URL = environment.apiBaseUrl;

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  getUser(id: number | string): Observable<User> {
    return this.http.get<User>(`${API_BASE_URL}/users/${id}`);
  }

  getProfile(id: number | string): Observable<User> {
    return this.getUser(id);
  }

  searchUsers(term: string): Observable<User[]> {
    return this.http.get<User[]>(`${API_BASE_URL}/users/search`, {
      params: { q: term }
    });
  }

  getSuggestions(): Observable<User[]> {
    return this.http.get<User[]>(`${API_BASE_URL}/users/suggestions`);
  }

  updateUser(id: number | string, data: Partial<Pick<User, 'name' | 'bio' | 'privacy' | 'cover_url' | 'avatar_url'>>): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${API_BASE_URL}/users/${id}`, data);
  }

  updateAvatar(id: number | string, avatar: File): Observable<{ message: string; avatar_url: string; user?: User }> {
    const formData = new FormData();
    formData.append('avatar', avatar);

    return this.http.post<{ message: string; avatar_url: string; user?: User }>(`${API_BASE_URL}/users/${id}/avatar`, formData);
  }

  updateCover(id: number | string, cover: File): Observable<{ message: string; cover_url: string; user?: User }> {
    const formData = new FormData();
    formData.append('cover', cover);

    return this.http.post<{ message: string; cover_url: string; user?: User }>(`${API_BASE_URL}/users/${id}/cover`, formData);
  }

  deleteUser(id: number | string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/users/${id}`);
  }

  follow(id: number | string): Observable<{ message: string; status?: string }> {
    return this.http.post<{ message: string; status?: string }>(`${API_BASE_URL}/users/${id}/follow`, {});
  }

  unfollow(id: number | string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/users/${id}/follow`);
  }

  getFollowers(id: number | string): Observable<User[]> {
    return this.http.get<User[]>(`${API_BASE_URL}/users/${id}/followers`);
  }

  getFollowing(id: number | string): Observable<User[]> {
    return this.http.get<User[]>(`${API_BASE_URL}/users/${id}/following`);
  }

  getFollowRequests(): Observable<User[]> {
    return this.http.get<User[]>(`${API_BASE_URL}/users/follow-requests`);
  }

  acceptFollowRequest(followerId: number | string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${API_BASE_URL}/users/follow-requests/${followerId}/accept`, {});
  }

  rejectFollowRequest(followerId: number | string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/users/follow-requests/${followerId}`);
  }
}
