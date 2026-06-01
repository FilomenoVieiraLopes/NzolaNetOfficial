import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Notification } from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notificacao',
  imports: [CommonModule, DatePipe],
  templateUrl: './notificacao.component.html',
  styleUrl: './notificacao.component.css'
})
export class NotificacaoComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  notifications: Notification[] = [];
  isLoading = true;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadNotifications();
    this.refreshTimer = setInterval(() => this.loadNotifications(false), 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadNotifications(showLoading = true): void {
    if (showLoading) this.isLoading = true;
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching notifications', error);
        this.isLoading = false;
      }
    });
  }

  markAsRead(notification: Notification): void {
    if (notification.read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => notification.read = true,
      error: (error) => console.error('Error marking notification as read', error)
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
      next: () => this.notifications = this.notifications.map((notification) => ({ ...notification, read: true })),
      error: (error) => console.error('Error marking notifications as read', error)
    });
  }

  deleteNotification(notification: Notification, event?: Event): void {
    event?.stopPropagation();

    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => this.notifications = this.notifications.filter((item) => item.id !== notification.id),
      error: (error) => console.error('Error deleting notification', error)
    });
  }

  labelFor(type: string): string {
    const labels: Record<string, string> = {
      comment: 'comentou na sua publicacao',
      baze: 'deu baze na sua publicacao',
      follow: 'comecou a seguir voce'
    };

    return labels[type] ?? `nova notificacao: ${type}`;
  }
}
