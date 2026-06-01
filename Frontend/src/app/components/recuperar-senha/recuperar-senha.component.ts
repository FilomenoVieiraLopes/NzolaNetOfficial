import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-recuperar-senha',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-senha.component.html'
})
export class RecuperarSenhaComponent {
  private authService = inject(AuthService);

  email = '';
  isLoading = false;
  message = '';
  error = '';

  submit(): void {
    if (!this.email.trim()) {
      this.error = 'Informe o email da sua conta.';
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.error = '';

    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.message = response.message;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.message || 'Nao foi possivel enviar o pedido de recuperacao.';
      }
    });
  }
}
