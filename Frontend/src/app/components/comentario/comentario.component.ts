import { Component, OnInit, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedService } from '../../services/feed.service';
import { AuthService } from '../../services/auth.service';
import { Comment } from '../../models/comment.model';
import { Post } from '../../models/post.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-comentario',
  imports: [RouterModule, CommonModule, FormsModule, DatePipe],
  templateUrl: './comentario.component.html',
  styleUrl: './comentario.component.css'
})
export class ComentarioComponent implements OnInit {
  private feedService = inject(FeedService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  post: Post | null = null;
  isLoading = true;
  commentText = '';
  currentUser = this.authService.getCurrentUser();
  editingCommentId: number | null = null;
  editCommentText = '';
  private pendingPostBaze = false;
  private pendingCommentBazeIds = new Set<number>();

  ngOnInit() {
    const postId = history.state?.postId;

    if (postId) {
      this.feedService.getPost(postId).subscribe({
        next: (res) => {
          this.post = res.data;
          this.isLoading = false;
        },
        error: (err) => {
          this.toast.error(this.toast.errorMessage(err, 'Nao foi possivel carregar a publicacao.'));
          this.loadFallback();
        }
      });
    } else {
      this.loadFallback();
    }
  }

  private loadFallback() {
    this.feedService.getPost(1).subscribe({
      next: (res) => {
        this.post = res.data;
        this.isLoading = false;
      }
    });
  }

  submitComment() {
    if (!this.commentText.trim() || !this.post) return;
    
    this.feedService.addComment(this.post.id, this.commentText).subscribe({
      next: () => {
        this.commentText = '';
        this.toast.success('Comentario publicado com sucesso.');
        this.feedService.getPost(this.post!.id).subscribe({
          next: (res) => this.post = res.data
        });
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel publicar o comentario.'))
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
        this.pendingPostBaze = false;
        if (!this.post) return;
        this.post.has_bazed = !this.post.has_bazed;
        this.post.bazes_count = Math.max(0, this.post.bazes_count + (this.post.has_bazed ? 1 : -1));
      },
      error: (error) => {
        this.pendingPostBaze = false;
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel atualizar o baze.'));
      }
    });
  }

  giveCommentBaze(comment: Comment): void {
    if (this.pendingCommentBazeIds.has(comment.id)) return;

    this.pendingCommentBazeIds.add(comment.id);
    const request = comment.has_bazed
      ? this.feedService.removeCommentBaze(comment.id)
      : this.feedService.giveCommentBaze(comment.id);

    request.subscribe({
      next: () => {
        comment.has_bazed = !comment.has_bazed;
        comment.bazes_count = Math.max(0, (comment.bazes_count || 0) + (comment.has_bazed ? 1 : -1));
        this.pendingCommentBazeIds.delete(comment.id);
      },
      error: (error) => {
        this.pendingCommentBazeIds.delete(comment.id);
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel atualizar o baze do comentario.'));
      }
    });
  }

  canEditComment(comment: Comment): boolean {
    return !!comment.can_edit || Number(comment.user_id) === Number(this.currentUser?.id);
  }

  canDeleteComment(comment: Comment): boolean {
    return !!comment.can_delete || Number(comment.user_id) === Number(this.currentUser?.id) || this.isAdmin();
  }

  startEditComment(comment: Comment): void {
    this.editingCommentId = comment.id;
    this.editCommentText = comment.body;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editCommentText = '';
  }

  saveComment(comment: Comment): void {
    const body = this.editCommentText.trim();
    if (!body) return;

    this.feedService.updateComment(comment.id, body).subscribe({
      next: (response) => {
        if (this.post?.comments) {
          this.post.comments = this.post.comments.map((item) => item.id === comment.id ? response.data : item);
        }
        this.cancelEditComment();
        this.toast.success('Comentario atualizado com sucesso.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel atualizar o comentario.'))
    });
  }

  deleteComment(comment: Comment): void {
    this.toast.confirm({
      title: 'Eliminar comentario',
      message: 'Deseja eliminar este comentario?',
      confirmText: 'Eliminar',
      tone: 'danger',
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.feedService.deleteComment(comment.id).subscribe({
        next: () => {
          if (this.post?.comments) {
            this.post.comments = this.post.comments.filter((item) => item.id !== comment.id);
            this.post.comments_count = Math.max(0, this.post.comments_count - 1);
          }
          this.toast.success('Comentario eliminado com sucesso.');
        },
        error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel eliminar o comentario.'))
      });
    });
  }

  private isAdmin(): boolean {
    return String(this.currentUser?.role || '').toLowerCase() === 'admin';
  }
}
