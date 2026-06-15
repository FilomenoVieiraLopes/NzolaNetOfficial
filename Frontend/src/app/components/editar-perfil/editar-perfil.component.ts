import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-editar-perfil',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './editar-perfil.component.html',
  styleUrl: './editar-perfil.component.css'
})
export class EditarPerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private router = inject(Router);

  user: User | null = null;
  name = '';
  bio = '';
  privacy: 'public' | 'private' = 'public';
  avatarPreview: string | null = null;
  avatarFile: File | null = null;
  coverPreview: string | null = null;
  coverFile: File | null = null;
  isSaving = false;
  error = '';

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.userService.getUser(currentUser.id).subscribe({
      next: (user) => this.fillForm(user),
      error: () => this.fillForm(currentUser)
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = this.validImageFile(input, 'A foto');
    if (!file) return;

    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview = reader.result as string;
    reader.readAsDataURL(file);
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = this.validImageFile(input, 'A imagem de capa');
    if (!file) return;

    this.coverFile = file;
    const reader = new FileReader();
    reader.onload = () => this.coverPreview = reader.result as string;
    reader.readAsDataURL(file);
  }

  async save(): Promise<void> {
    if (!this.user || !this.name.trim()) {
      this.toast.warning('O nome do perfil e obrigatorio.');
      return;
    }

    this.isSaving = true;
    this.error = '';

    try {
      const profileResponse = await firstValueFrom(this.userService.updateUser(this.user.id, {
        name: this.name.trim(),
        bio: this.bio.trim() || null,
        privacy: this.privacy
      }));

      let savedUser = profileResponse.user;

      if (this.avatarFile) {
        const avatarResponse = await firstValueFrom(this.userService.updateAvatar(savedUser.id, this.avatarFile));
        savedUser = avatarResponse.user || {
          ...savedUser,
          avatar_url: avatarResponse.avatar_url
        };
      }

      if (this.coverFile) {
        const coverResponse = await firstValueFrom(this.userService.updateCover(savedUser.id, this.coverFile));
        savedUser = coverResponse.user || {
          ...savedUser,
          cover_url: coverResponse.cover_url
        };
      }

      this.finishSave(savedUser);
    } catch (error) {
      this.error = this.validationMessage(error);
      this.toast.error(this.error);
      this.isSaving = false;
    }
  }

  private fillForm(user: User): void {
    this.user = user;
    this.name = user.name;
    this.bio = user.bio || '';
    this.privacy = user.privacy === 'private' ? 'private' : 'public';
    this.avatarPreview = user.avatar_url ?? null;
    this.coverPreview = user.cover_url ?? null;
  }

  private finishSave(user: User): void {
    this.authService.setCurrentUser(user);
    this.isSaving = false;
    this.toast.success('Perfil guardado com sucesso.');
    this.router.navigate(['/app/perfil']);
  }

  private validImageFile(input: HTMLInputElement, fieldName: string): File | null {
    const file = input.files?.[0];
    if (!file) return null;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      this.error = `${fieldName} deve ser JPG, PNG, WEBP ou GIF.`;
      this.toast.warning(this.error);
      input.value = '';
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.error = `${fieldName} deve ter no maximo 5MB.`;
      this.toast.warning(this.error);
      input.value = '';
      return null;
    }

    this.error = '';
    return file;
  }

  private validationMessage(error: unknown): string {
    const response = error as { error?: { message?: string; errors?: Record<string, string[]> } };
    const firstFieldError = response.error?.errors ? Object.values(response.error.errors)[0]?.[0] : null;
    return firstFieldError || response.error?.message || 'Nao foi possivel guardar o perfil.';
  }
}
