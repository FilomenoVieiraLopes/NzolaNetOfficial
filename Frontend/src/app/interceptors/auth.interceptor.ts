import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const token = localStorage.getItem('nzolanet_session_token');

  if (!token) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authenticatedRequest).pipe(
    catchError((error) => {
      // Se o token deixou de ser valido, limpamos a sessao antes de voltar ao login.
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        localStorage.removeItem('nzolanet_session_token');
        localStorage.removeItem('nzolanet_session_user');
        toast.warning('Sessao expirada. Entre novamente para continuar.');
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
