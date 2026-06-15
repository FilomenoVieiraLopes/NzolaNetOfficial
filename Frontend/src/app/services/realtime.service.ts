import { Injectable } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../models/notification.model';

const API_BASE_URL = environment.apiBaseUrl;
const REVERB_APP_KEY = environment.reverb.appKey;
const REVERB_HOST = environment.reverb.host;
const REVERB_PORT = environment.reverb.port;
const REVERB_SCHEME = environment.reverb.scheme;

export interface FeedUpdatedEvent {
  action: string;
  post_id?: number | null;
  actor_id?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private echo: Echo<'reverb'> | null = null;
  private connectedUserId: number | string | null = null;
  private notificationCreatedSubject = new Subject<Notification>();
  private feedUpdatedSubject = new Subject<FeedUpdatedEvent>();

  notificationCreated$ = this.notificationCreatedSubject.asObservable();
  feedUpdated$ = this.feedUpdatedSubject.asObservable();

  connect(userId: number | string | null | undefined): void {
    if (!userId) return;
    if (this.echo && String(this.connectedUserId) === String(userId)) return;

    this.disconnect();

    // O canal privado usa o token Sanctum para confirmar que o utilizador pode ouvir eventos.
    const token = localStorage.getItem('nzolanet_session_token');
    if (!token) return;

    window.Pusher = Pusher;

    this.echo = new Echo({
      broadcaster: 'reverb',
      key: REVERB_APP_KEY,
      wsHost: REVERB_HOST,
      wsPort: REVERB_PORT,
      wssPort: REVERB_PORT,
      forceTLS: REVERB_SCHEME !== 'http',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    });

    this.connectedUserId = userId;

    // Notificacoes sao privadas: apenas o dono da conta recebe o evento.
    this.echo
      .private(`users.${userId}`)
      .listen('.notification.created', (event: { notification: Notification }) => {
        this.notificationCreatedSubject.next(event.notification);
      });

    // O feed e publico para atualizar posts, bazes e comentarios em tempo real.
    this.echo
      .channel('feed')
      .listen('.feed.updated', (event: FeedUpdatedEvent) => {
        this.feedUpdatedSubject.next(event);
      });
  }

  disconnect(): void {
    if (!this.echo) return;

    // Ao trocar de utilizador ou sair, limpamos canais para evitar eventos duplicados.
    if (this.connectedUserId) {
      this.echo.leave(`users.${this.connectedUserId}`);
    }

    this.echo.leave('feed');
    this.echo.disconnect();
    this.echo = null;
    this.connectedUserId = null;
  }
}

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}
