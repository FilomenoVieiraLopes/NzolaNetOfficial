import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

const API_BASE_URL = environment.apiBaseUrl;

interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private tokenKey = 'nzolanet_session_token';
  private userKey = 'nzolanet_session_user';

  constructor() { }

  private saveSession(res: AuthResponse): void {
    // O token Sanctum fica no browser para autenticar as proximas chamadas HTTP.
    localStorage.setItem(this.tokenKey, res.token);
    localStorage.setItem(this.userKey, JSON.stringify(res.user));
  }

  login(email: string, password: string): Observable<{ success: boolean; token: string; user: User }> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, { email, password }).pipe(
      tap((res) => this.saveSession(res)),
      map((res) => ({ success: true, token: res.token, user: res.user }))
    );
  }

  register(data: any): Observable<{ success: boolean; token: string; user: User }> {
    // O formulario usa nomes amigaveis; aqui adaptamos para o contrato esperado pela API.
    const payload = {
      avatar_url: data.avatarUrl,
      name: data.fullName ?? data.name,
      email: data.email,
      password: data.password,
      password_confirmation: data.passwordConfirmation ?? data.password
    };

    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register`, payload).pipe(
      tap((res) => this.saveSession(res)),
      map((res) => ({ success: true, token: res.token, user: res.user }))
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/auth/forgot-password`, { email });
  }

  resetPassword(data: { token: string; email: string; password: string; password_confirmation: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/auth/reset-password`, data);
  }

  logout() {
    // Termina a sessao local e devolve o utilizador para a area publica.
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): User | null {
    // Mantemos uma copia local do utilizador para preencher menus e perfil sem nova chamada.
    const stored = localStorage.getItem(this.userKey);
    return stored ? JSON.parse(stored) : null;
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.id ? String(user.id) : null;
  }
}
