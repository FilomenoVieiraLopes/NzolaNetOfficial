import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Post } from '../../models/post.model';
import { AuthService } from '../../services/auth.service';
import { FeedService } from '../../services/feed.service';
import { ToastService } from '../../services/toast.service';
import { PostCommentsComponent } from '../post-comments/post-comments.component';

@Component({
  selector: 'app-comentario',
  imports: [RouterModule, CommonModule, DatePipe, PostCommentsComponent],
  templateUrl: './comentario.component.html',
  styleUrl: './comentario.component.css'
})
export class ComentarioComponent implements OnInit {
  private feedService = inject(FeedService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  post: Post | null = null;
  isLoading = true;
  currentUser = this.authService.getCurrentUser();
  private pendingPostBaze = false;

  ngOnInit(): void {
    const postId = Number(history.state?.postId || 1);
    this.loadPost(postId);
  }

  loadPost(postId: number): void {
    this.isLoading = true;

    this.feedService.getPost(postId).subscribe({
      next: (response) => {
        this.post = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar a publicacao.'));
        this.isLoading = false;
      }
    });
  }

  giveBaze(): void {
    if (!this.post || this.pendingPostBaze) return;

    this.pendingPostBaze = true;
    const request = this.post.has_bazed
      ? this.feedService.removeBaze(this.post.id)
      : this.feedService.giveBaze(this.post.id);

    request.subscribe({
      next: () => {
        if (!this.post) return;

        this.post.has_bazed = !this.post.has_bazed;
        this.post.bazes_count = Math.max(0, this.post.bazes_count + (this.post.has_bazed ? 1 : -1));
        this.pendingPostBaze = false;
      },
      error: (error) => {
        this.pendingPostBaze = false;
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel atualizar o baze.'));
      }
    });
  }

  isAdmin(): boolean {
    return String(this.currentUser?.role || '').toLowerCase() === 'admin';
  }
}
