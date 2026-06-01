import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-resetar-senha',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './resetar-senha.component.html'
})
export class ResetarSenhaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  token = '';
  email = '';
  password = '';
  passwordConfirmation = '';
  isLoading = false;
  message = '';
  error = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
  }

  submit(): void {
    if (!this.token.trim() || !this.email.trim()) {
      this.error = 'Link de recuperacao invalido ou incompleto.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'A nova palavra-passe deve ter pelo menos 6 caracteres.';
      return;
    }

    if (this.password !== this.passwordConfirmation) {
      this.error = 'A confirmacao da palavra-passe nao coincide.';
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.error = '';

    this.authService.resetPassword({
      token: this.token.trim(),
      email: this.email.trim(),
      password: this.password,
      password_confirmation: this.passwordConfirmation
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.message = response.message;
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.message || 'Nao foi possivel redefinir a senha.';
      }
    });
  }
}
