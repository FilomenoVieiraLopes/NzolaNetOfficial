import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-registrar',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './registrar.component.html',
  styleUrls: ['./registrar.component.css']
})
export class RegistrarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  avatar_url = '';
  fullName = '';
  bio = '';
  email = '';
  password = '';
  termsAccepted = false;
  profileImage: string | null = null;
  isLoading = false;

  onSubmit(): void {
    if (!this.fullName.trim() || !this.email.trim() || !this.password) {
      alert('Por favor, preencha nome, email e palavra-passe.');
      return;
    }

    if (!this.termsAccepted) {
      alert('Precisa aceitar os termos de servico para continuar.');
      return;
    }

    this.isLoading = true;
    this.authService.register({
      avatar_url: this.avatar_url,
      fullName: this.fullName.trim(),
      bio: this.bio.trim() || null,
      email: this.email.trim(),
      password: this.password,
      profileImage: this.profileImage
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/app/home']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        alert(err?.error?.message || 'Erro ao registar utilizador. Tente novamente.');
        console.error(err);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (file.size > 2 * 1024 * 1024) {
        alert('Imagem muito grande. Maximo 2MB.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um ficheiro de imagem.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.profileImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('photoUpload') as HTMLInputElement;
    fileInput?.click();
  }
}
