import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  searchUsers(term: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/search`, {
      params: { q: term }
    });
  }

  updateUser(id: number, data: Partial<Pick<User, 'name' | 'bio' | 'privacy'>>): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.apiUrl}/users/${id}`, data);
  }

  updateAvatar(id: number, avatar: File): Observable<{ message: string; user: User }> {
    const formData = new FormData();
    formData.append('avatar', avatar);

    return this.http.post<{ message: string; user: User }>(`${this.apiUrl}/users/${id}/avatar`, formData);
  }

  follow(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/users/${id}/follow`, {});
  }

  unfollow(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id}/follow`);
  }

  getFollowers(id: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/${id}/followers`);
  }

  getFollowing(id: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/${id}/following`);
  }
}
