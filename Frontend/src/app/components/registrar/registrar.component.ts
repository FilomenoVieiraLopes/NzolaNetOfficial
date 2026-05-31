import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  standalone: true,
  selector: 'app-registrar',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './registrar.component.html',
  styleUrls: ['./registrar.component.css']
})
export class RegistrarComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  termsAccepted = false;
  profileImage: string | null = null;
  selectedAvatarFile: File | null = null;
  isLoading = false;

  onSubmit(): void {
    if (!this.fullName || !this.email || !this.password) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (!this.termsAccepted) {
      alert('Você precisa aceitar os termos de serviço para continuar.');
      return;
    }

    this.isLoading = true;
    this.authService.register({
      name: this.fullName,
      email: this.email,
      password: this.password,
      password_confirmation: this.password
    }).subscribe({
      next: (res) => {
        if (res.success && this.selectedAvatarFile) {
          this.userService.updateAvatar(res.user.id, this.selectedAvatarFile).subscribe({
            next: () => {
              this.isLoading = false;
              this.router.navigate(['/app/home']);
            },
            error: (err) => {
              this.isLoading = false;
              console.error(err);
              this.router.navigate(['/app/home']);
            }
          });
          return;
        }

        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/app/home']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        alert('Erro ao registar utilizador. Tente novamente.');
        console.error(err);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validar tamanho (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Imagem muito grande! Máximo 2MB.');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem.');
        return;
      }

      this.selectedAvatarFile = file;

      // Ler arquivo e criar preview
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
