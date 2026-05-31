import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FeedService } from '../../services/feed.service';

@Component({
  selector: 'app-criar-post',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './criarPost.component.html',
  styleUrl: './criarPost.component.css'
})
export class CriarPostComponent {
  private feedService = inject(FeedService);
  private router = inject(Router);

  isPublic: boolean = true;
  postText: string = '';
  selectedImage: string | ArrayBuffer | null = null;
  selectedMediaType: 'image' | 'video' | null = null;
  showEmojiPicker: boolean = false;
  isPublishing: boolean = false;

  emojis: string[] = ['😀', '😂', '😍', '🙏', '👍', '🔥', '🎉', '💡', '✨', '🙌', '🤔', '😎'];

  toggleVisibility() {
    this.isPublic = !this.isPublic;
  }

  publishPost() {
    if (!this.postText.trim() && !this.selectedImage) return;

    this.isPublishing = true;
    
    this.feedService.createPost({
      content: this.postText,
      media_url: this.selectedImage as string,
      media_type: this.selectedMediaType,
      is_public: this.isPublic,
      location: this.selectedLocation
    }).subscribe({
      next: () => {
        this.isPublishing = false;
        this.router.navigate(['/app/home']);
      },
      error: (err) => {
        console.error('Error publishing post', err);
        this.isPublishing = false;
      }
    });
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        this.selectedMediaType = 'video';
      } else {
        this.selectedMediaType = 'image';
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.selectedImage = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.selectedMediaType = null;
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    if (this.showEmojiPicker) {
      this.showLocationPicker = false;
      this.showGifPicker = false;
    }
  }

  addEmoji(emoji: string) {
    this.postText += emoji;
    this.showEmojiPicker = false;
  }

  showLocationPicker: boolean = false;
  locations: string[] = ['Luanda, Angola', 'Lisboa, Portugal', 'São Paulo, Brasil', 'Maputo, Moçambique'];
  selectedLocation: string | null = null;

  toggleLocationPicker() {
    this.showLocationPicker = !this.showLocationPicker;
    if (this.showLocationPicker) {
      this.showEmojiPicker = false;
      this.showGifPicker = false;
    }
  }

  selectLocation(loc: string) {
    this.selectedLocation = loc;
    this.showLocationPicker = false;
  }

  removeLocation() {
    this.selectedLocation = null;
  }

  showGifPicker: boolean = false;
  gifs: string[] = [
    'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif',
    'https://media.tenor.com/1-qA2hR3oKMAAAAC/good-morning.gif',
    'https://media.tenor.com/bK1Np_0QpP4AAAAC/wow-cat.gif',
    'https://media.tenor.com/Z4O8E1kE_5MAAAAC/dancing-duck.gif'
  ];

  toggleGifPicker() {
    this.showGifPicker = !this.showGifPicker;
    if (this.showGifPicker) {
      this.showEmojiPicker = false;
      this.showLocationPicker = false;
    }
  }

  selectGif(gifUrl: string) {
    this.selectedMediaType = 'image';
    this.selectedImage = gifUrl;
    this.showGifPicker = false;
  }
}
