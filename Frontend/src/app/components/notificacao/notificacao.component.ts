import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Notification } from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-notificacao',
  imports: [CommonModule, DatePipe],
  templateUrl: './notificacao.component.html',
  styleUrl: './notificacao.component.css'
})
export class NotificacaoComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);
  private userService = inject(UserService);
  private router = inject(Router);

  notifications: Notification[] = [];
  isLoading = true;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadNotifications();
    this.pollingTimer = setInterval(() => this.loadNotifications(false), 10000);
  }

  ngOnDestroy(): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
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

  acceptFollowRequest(notification: Notification, event: Event): void {
    event.stopPropagation();

    if (!notification.actor_id) {
      this.toast.error('Nao foi possivel identificar quem fez o pedido.');
      return;
    }

    this.userService.acceptFollowRequest(notification.actor_id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter((item) => item.id !== notification.id);
        this.toast.success('Pedido aceite com sucesso.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel aceitar o pedido.'))
    });
  }

  rejectFollowRequest(notification: Notification, event: Event): void {
    event.stopPropagation();

    if (!notification.actor_id) {
      this.toast.error('Nao foi possivel identificar quem fez o pedido.');
      return;
    }

    this.userService.rejectFollowRequest(notification.actor_id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter((item) => item.id !== notification.id);
        this.toast.success('Pedido rejeitado.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel rejeitar o pedido.'))
    });
  }

  labelFor(type: string): string {
    const labels: Record<string, string> = {
      comment: 'comentou na sua publicacao',
      baze: 'deu baze na sua publicacao',
      comment_baze: 'deu baze no seu comentario',
      comment_reply: 'respondeu ao seu comentario',
      follow: 'comecou a seguir voce',
      follow_request: 'pediu para seguir voce',
      follow_accepted: 'aceitou o seu pedido para seguir'
    };

    return labels[type] ?? `nova notificacao: ${type}`;
  }
}
