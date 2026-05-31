import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
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
  private router = inject(Router);

  user: User | null = null;
  name = '';
  bio = '';
  privacy: 'public' | 'private' = 'public';
  avatarPreview: string | null = null;
  avatarFile: File | null = null;
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
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview = reader.result as string;
    reader.readAsDataURL(file);
  }

  save(): void {
    if (!this.user || !this.name.trim()) {
      return;
    }

    this.isSaving = true;
    this.error = '';
    this.userService.updateUser(this.user.id, {
      name: this.name,
      bio: this.bio.trim() || null,
      privacy: this.privacy
    }).subscribe({
      next: (response) => {
        if (this.avatarFile) {
          this.userService.updateAvatar(response.user.id, this.avatarFile).subscribe({
            next: (avatarResponse) => this.finishSave(avatarResponse.user),
            error: (error) => {
              console.error('Error updating avatar', error);
              this.finishSave(response.user);
            }
          });
          return;
        }

        this.finishSave(response.user);
      },
      error: (error) => {
        console.error('Error updating profile', error);
        this.error = this.validationMessage(error);
        this.isSaving = false;
      }
    });
  }

  private fillForm(user: User): void {
    this.user = user;
    this.name = user.name;
    this.bio = user.bio || '';
    this.privacy = user.privacy === 'private' ? 'private' : 'public';
    this.avatarPreview = user.avatar_url;
  }

  private finishSave(user: User): void {
    this.authService.setCurrentUser(user);
    this.isSaving = false;
    this.router.navigate(['/app/perfil']);
  }

  private validationMessage(error: unknown): string {
    const response = error as {
      error?: {
        message?: string;
        errors?: Record<string, string[]>;
      };
    };

    const firstFieldError = response.error?.errors
      ? Object.values(response.error.errors)[0]?.[0]
      : null;

    return firstFieldError || response.error?.message || 'Nao foi possivel guardar o perfil.';
  }
}
