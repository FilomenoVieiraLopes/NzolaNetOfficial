import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Notification } from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notificacao',
  imports: [CommonModule, DatePipe],
  templateUrl: './notificacao.component.html',
  styleUrl: './notificacao.component.css'
})
export class NotificacaoComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  notifications: Notification[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;

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
    if (notification.read) {
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => notification.read = true,
      error: (error) => console.error('Error marking notification as read', error)
    });
  }

  openNotification(notification: Notification): void {
    this.markAsRead(notification);

    if (notification.post_id) {
      this.router.navigate(['/app/home']);
      return;
    }

    if (notification.actor_name) {
      this.router.navigate(['/app/pesquisar'], {
        queryParams: { q: notification.actor_name }
      });
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.notifications = this.notifications.map((notification) => ({
        ...notification,
        read: true
      })),
      error: (error) => console.error('Error marking notifications as read', error)
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
