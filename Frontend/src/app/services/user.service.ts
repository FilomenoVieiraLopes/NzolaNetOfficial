import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

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

  updateUser(id: number | string, data: Partial<Pick<User, 'name' | 'bio' | 'privacy' | 'cover_url' | 'avatar_url'>>): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${API_BASE_URL}/users/${id}`, data);
  }

  updateAvatar(id: number | string, avatar: File): Observable<{ message: string; avatar_url: string; user?: User }> {
    const formData = new FormData();
    formData.append('avatar', avatar);

    return this.http.post<{ message: string; avatar_url: string; user?: User }>(`${API_BASE_URL}/users/${id}/avatar`, formData);
  }

  follow(id: number | string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/users/${id}/follow`, {});
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
}
