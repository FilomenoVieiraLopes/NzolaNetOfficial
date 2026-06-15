import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FeedService } from '../../services/feed.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-criar-post',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './criarPost.component.html',
  styleUrl: './criarPost.component.css'
})
export class CriarPostComponent {
  private feedService = inject(FeedService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  currentUser = this.authService.getCurrentUser();
  postText = '';
  selectedImage: string | ArrayBuffer | null = null;
  selectedMediaType: 'image' | 'video' | null = null;
  selectedFile: File | null = null;
  showEmojiPicker = false;
  isPublishing = false;
  emojis: string[] = [':)', ':D', '<3', '+1', '!!', '?'];

  publishPost(): void {
    if (!this.postText.trim() && !this.selectedFile) {
      this.toast.warning('Escreva algo ou escolha uma imagem/video para publicar.');
      return;
    }

    this.isPublishing = true;
    this.feedService.createPost({
      content: this.postText,
      image: this.selectedMediaType === 'image' ? this.selectedFile : null,
      video: this.selectedMediaType === 'video' ? this.selectedFile : null
    }).subscribe({
      next: () => {
        this.isPublishing = false;
        this.toast.success('Publicacao criada com sucesso.');
        this.router.navigate(['/app/home']);
      },
      error: (err) => {
        this.toast.error(this.toast.errorMessage(err, 'Nao foi possivel publicar. Verifique o conteudo e tente novamente.'));
        this.isPublishing = false;
      }
    });
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedMediaType = file.type.startsWith('video/') ? 'video' : 'image';

    if (!this.fileIsValid(file)) {
      input.value = '';
      this.clearSelectedMedia();
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => this.selectedImage = reader.result;
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.clearSelectedMedia();
  }

  private clearSelectedMedia(): void {
    this.selectedImage = null;
    this.selectedMediaType = null;
    this.selectedFile = null;
  }

  private fileIsValid(file: File): boolean {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      this.toast.warning('Escolha uma imagem ou um video.');
      return false;
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toast.warning(isVideo
        ? 'O video deve ter no maximo 50MB.'
        : 'A imagem deve ter no maximo 5MB.');
      return false;
    }

    return true;
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string): void {
    this.postText += emoji;
    this.showEmojiPicker = false;
  }
}
