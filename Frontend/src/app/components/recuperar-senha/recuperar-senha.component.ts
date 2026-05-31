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
  message = '';
  error = '';
  isLoading = false;

  submit(): void {
    if (!this.email.trim()) {
      this.error = 'Informe o email da conta.';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.message = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.message = response.message;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error?.error?.message || 'Nao foi possivel iniciar a recuperacao.';
        this.isLoading = false;
      }
    });
  }
}
