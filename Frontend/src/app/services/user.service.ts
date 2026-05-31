import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface UserProfile {
  id: number | string;
  name: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  privacy?: 'public' | 'private';
  email?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = this.authService.getToken();
    if (!token) {
      return undefined;
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getProfile(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${API_BASE_URL}/users/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getFollowers(userId: string): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${API_BASE_URL}/users/${userId}/followers`, {
      headers: this.getAuthHeaders()
    });
  }

  getFollowing(userId: string): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${API_BASE_URL}/users/${userId}/following`, {
      headers: this.getAuthHeaders()
    });
  }

  updateAvatar(userId: string, file: File): Observable<{ message: string; avatar_url: string; cover_url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.http.post<{ message: string; avatar_url: string; cover_url: string }>(
      `${API_BASE_URL}/users/${userId}/avatar`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }
}
