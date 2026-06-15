import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ConfirmTone = 'danger' | 'primary';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

export interface ConfirmDialog {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  tone: ConfirmTone;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 1;
  private activeConfirm: Subject<boolean> | null = null;
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  private confirmSubject = new BehaviorSubject<ConfirmDialog | null>(null);

  toasts$ = this.toastsSubject.asObservable();
  confirm$ = this.confirmSubject.asObservable();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  show(type: ToastType, message: string): void {
    const toast = { id: this.nextId++, type, message };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    setTimeout(() => this.dismiss(toast.id), 4500);
  }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
  }

  confirm(options: Partial<ConfirmDialog> & Pick<ConfirmDialog, 'message'>): Observable<boolean> {
    if (this.activeConfirm) {
      this.resolveConfirm(false);
    }

    this.activeConfirm = new Subject<boolean>();
    this.confirmSubject.next({
      title: options.title ?? 'Confirmar acao',
      message: options.message,
      confirmText: options.confirmText ?? 'Confirmar',
      cancelText: options.cancelText ?? 'Cancelar',
      tone: options.tone ?? 'primary',
    });

    return this.activeConfirm.asObservable();
  }

  resolveConfirm(confirmed: boolean): void {
    if (!this.activeConfirm) return;

    this.activeConfirm.next(confirmed);
    this.activeConfirm.complete();
    this.activeConfirm = null;
    this.confirmSubject.next(null);
  }

  errorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const value = (error as { error?: { message?: string; errors?: Record<string, string[]> } }).error;

      if (value?.message) return value.message;

      const firstFieldError = value?.errors
        ? Object.values(value.errors).flat()[0]
        : null;

      if (firstFieldError) return firstFieldError;
    }

    return fallback;
  }
}
