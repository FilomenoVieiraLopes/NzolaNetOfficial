import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-redefinir-senha',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './redefinir-senha.component.html'
})
export class RedefinirSenhaComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = '';
  email = '';
  password = '';
  passwordConfirmation = '';
  message = '';
  error = '';
  isLoading = false;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
  }

  submit(): void {
    if (!this.token || !this.email || !this.password || this.password !== this.passwordConfirmation) {
      this.error = 'Confirme token, email e senhas iguais.';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.message = '';

    this.authService.resetPassword({
      token: this.token,
      email: this.email,
      password: this.password,
      password_confirmation: this.passwordConfirmation
    }).subscribe({
      next: (response) => {
        this.message = response.message;
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (error) => {
        this.error = error?.error?.message || 'Nao foi possivel redefinir a senha.';
        this.isLoading = false;
      }
    });
  }
}
