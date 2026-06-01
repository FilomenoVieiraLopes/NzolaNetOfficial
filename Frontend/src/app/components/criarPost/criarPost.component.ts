import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FeedService } from '../../services/feed.service';

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

  currentUser = this.authService.getCurrentUser();
  postText = '';
  selectedImage: string | ArrayBuffer | null = null;
  selectedMediaType: 'image' | 'video' | null = null;
  selectedFile: File | null = null;
  showEmojiPicker = false;
  isPublishing = false;
  emojis: string[] = [':)', ':D', '<3', '+1', '!!', '?'];

  publishPost(): void {
    if (!this.postText.trim() && !this.selectedFile) return;

    this.isPublishing = true;
    this.feedService.createPost({
      content: this.postText,
      image: this.selectedMediaType === 'image' ? this.selectedFile : null,
      video: this.selectedMediaType === 'video' ? this.selectedFile : null
    }).subscribe({
      next: () => {
        this.isPublishing = false;
        this.router.navigate(['/app/home']);
      },
      error: (err) => {
        console.error('Error publishing post', err);
        alert(err?.error?.message || 'Nao foi possivel publicar. Verifique o conteudo e tente novamente.');
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
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => this.selectedImage = reader.result;
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImage = null;
    this.selectedMediaType = null;
    this.selectedFile = null;
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string): void {
    this.postText += emoji;
    this.showEmojiPicker = false;
  }
}
