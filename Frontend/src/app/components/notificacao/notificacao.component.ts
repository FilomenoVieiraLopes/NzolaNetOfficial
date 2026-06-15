import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Notification } from '../../models/notification.model';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { RealtimeService } from '../../services/realtime.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-notificacao',
  imports: [CommonModule, DatePipe],
  templateUrl: './notificacao.component.html',
  styleUrl: './notificacao.component.css'
})
export class NotificacaoComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private realtimeService = inject(RealtimeService);
  private toast = inject(ToastService);
  private router = inject(Router);

  notifications: Notification[] = [];
  isLoading = true;
  private realtimeSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.loadNotifications();
    this.realtimeService.connect(this.authService.getCurrentUser()?.id);
    this.realtimeSubscription = this.realtimeService.notificationCreated$.subscribe((notification) => {
      this.notifications = [notification, ...this.notifications]
        .filter((item, index, list) => list.findIndex((current) => current.id === item.id) === index);
    });
  }

  ngOnDestroy(): void {
    this.realtimeSubscription?.unsubscribe();
    this.realtimeService.disconnect();
  }

  loadNotifications(showLoading = true): void {
    if (showLoading) this.isLoading = true;
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.isLoading = false;
      },
      error: (error) => {
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar notificacoes.'));
        this.isLoading = false;
      }
    });
  }

  markAsRead(notification: Notification): void {
    if (notification.read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => notification.read = true,
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel marcar a notificacao como lida.'))
    });
  }

  openNotification(notification: Notification): void {
    this.markAsRead(notification);

    if (notification.post_id) {
      this.router.navigate(['/app/home'], { state: { postId: notification.post_id } });
      return;
    }

    if (notification.actor_id) {
      this.router.navigate(['/app/perfil', notification.actor_id]);
      return;
    }

    this.router.navigate(['/app/home']);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) => ({ ...notification, read: true }));
        this.toast.success('Notificacoes marcadas como lidas.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel marcar notificacoes como lidas.'))
    });
  }

  deleteNotification(notification: Notification, event?: Event): void {
    event?.stopPropagation();

    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter((item) => item.id !== notification.id);
        this.toast.success('Notificacao eliminada.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel eliminar a notificacao.'))
    });
  }

  labelFor(type: string): string {
    const labels: Record<string, string> = {
      comment: 'comentou na sua publicacao',
      baze: 'deu baze na sua publicacao',
      follow: 'comecou a seguir voce',
      follow_request: 'pediu para seguir voce',
      follow_accepted: 'aceitou o seu pedido para seguir'
    };

    return labels[type] ?? `nova notificacao: ${type}`;
  }
}
