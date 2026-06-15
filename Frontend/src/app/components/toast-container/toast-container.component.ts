import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastMessage, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html'
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  iconFor(toast: ToastMessage): string {
    const icons: Record<ToastMessage['type'], string> = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info',
    };

    return icons[toast.type];
  }

  classFor(toast: ToastMessage): string {
    const classes: Record<ToastMessage['type'], string> = {
      success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      error: 'border-red-200 bg-red-50 text-red-900',
      warning: 'border-amber-200 bg-amber-50 text-amber-900',
      info: 'border-blue-200 bg-blue-50 text-blue-900',
    };

    return classes[toast.type];
  }
}
