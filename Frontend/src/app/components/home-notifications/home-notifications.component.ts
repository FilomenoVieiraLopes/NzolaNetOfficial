import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { notificationText } from '../../helpers/notification-text';
import { Notification } from '../../models/notification.model';

@Component({
  selector: 'app-home-notifications',
  imports: [CommonModule, DatePipe, RouterModule],
  templateUrl: './home-notifications.component.html'
})
export class HomeNotificationsComponent {
  @Input() notifications: Notification[] = [];
  @Input() unreadNotifications = 0;
  @Input() showNotifications = false;

  @Output() toggle = new EventEmitter<void>();
  @Output() markAllRead = new EventEmitter<void>();
  @Output() open = new EventEmitter<Notification>();
  @Output() delete = new EventEmitter<{ notification: Notification; event: Event }>();
  @Output() acceptFollow = new EventEmitter<{ notification: Notification; event: Event }>();
  @Output() rejectFollow = new EventEmitter<{ notification: Notification; event: Event }>();
  @Output() closePanel = new EventEmitter<void>();

  labelFor(type: string): string {
    return notificationText(type);
  }

  iconFor(type: string): string {
    if (type === 'follow' || type === 'follow_request' || type === 'follow_accepted') return 'person_add';
    if (type === 'baze' || type === 'comment_baze') return 'favorite';
    return 'mode_comment';
  }
}
