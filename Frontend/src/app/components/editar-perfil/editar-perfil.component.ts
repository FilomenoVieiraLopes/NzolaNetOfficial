import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './editar-perfil.component.html',
  styleUrl: './editar-perfil.component.css'
})
export class EditarPerfilComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  avatarPreview: string | null = null;
  coverPreview: string | null = null;
  uploadingAvatar = false;
  uploadError: string = '';

  avatar_url='';
  cover_url='';
  fullName = '';
  bio = '';
  location = '';
  website = '';

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.userService.getProfile(userId).subscribe({
      next: (profile) => {
        this.avatar_url=profile.avatar_url ||'';
        this.cover_url= profile.cover_url ||'';
        this.fullName = profile.name || '';
        this.bio = profile.bio || '';
        this.avatarPreview = profile.avatar_url || null;
        this.coverPreview = profile.cover_url || null;
      },
      error: (err) => console.error('Erro ao carregar perfil:', err)
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validação básica
    if (!file.type.startsWith('image/')) {
      this.uploadError = 'Por favor, seleciona uma imagem válida.';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.uploadError = 'A imagem não pode ser maior que 2MB.';
      return;
    }

    // Preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Upload para o backend
    this.uploadAvatar(file);
  }

  private uploadAvatar(file: File): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.uploadError = 'Utilizador não autenticado.';
      return;
    }

    this.uploadingAvatar = true;
    this.uploadError = '';

    this.userService.updateAvatar(userId, file).subscribe({
      next: (response) => {
        this.avatarPreview = response.avatar_url;
        this.uploadingAvatar = false;
      },
      error: (err) => {
        console.error('Erro ao fazer upload de avatar:', err);
        this.uploadError = err.error?.message || 'Erro ao fazer upload do avatar.';
        this.uploadingAvatar = false;
      }
    });
  }

  triggerAvatarUpload(): void {
    const input = document.getElementById('avatarInput') as HTMLInputElement;
    input?.click();
  }

  triggerCoverUpload(): void {
    const input = document.getElementById('coverInput') as HTMLInputElement;
    input?.click();
  }

  saveChanges(): void {
    // Implementar depois - PUT /api/users/{id}
    console.log('Salvando alterações...', {
      fullName: this.fullName,
      bio: this.bio,
      location: this.location,
      website: this.website,
      avatar_url: this.avatar_url,
      cover_url: this.cover_url
    });
  }
}
