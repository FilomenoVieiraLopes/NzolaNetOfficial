import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginResult {
  success: boolean;
  token: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;
  private tokenKey = 'nzolanet_session_token';
  private userKey = 'nzolanet_session_user';

  login(email: string, password: string): Observable<LoginResult> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((response) => this.saveSession(response)),
      map((response) => this.toLoginResult(response))
    );
  }

  register(data: RegisterPayload): Observable<LoginResult> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap((response) => this.saveSession(response)),
      map((response) => this.toLoginResult(response))
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, data);
  }

  logout(): void {
    const token = this.getToken();

    if (token) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
        error: () => undefined
      });
    }

    this.clearSession();
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): User | null {
    const rawUser = localStorage.getItem(this.userKey);
    return rawUser ? JSON.parse(rawUser) as User : null;
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
  }

  private toLoginResult(response: AuthResponse): LoginResult {
    return {
      success: true,
      token: response.token,
      user: response.user
    };
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}
