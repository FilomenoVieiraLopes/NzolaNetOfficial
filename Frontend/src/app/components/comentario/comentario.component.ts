import { Component, OnInit, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedService } from '../../services/feed.service';
import { AuthService } from '../../services/auth.service';
import { Comment } from '../../models/comment.model';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-comentario',
  imports: [RouterModule, CommonModule, FormsModule, DatePipe],
  templateUrl: './comentario.component.html',
  styleUrl: './comentario.component.css'
})
export class ComentarioComponent implements OnInit {
  private feedService = inject(FeedService);
  private authService = inject(AuthService);
  private router = inject(Router);

  post: Post | null = null;
  isLoading = true;
  commentText = '';
  currentUser = this.authService.getCurrentUser();
  editingCommentId: number | null = null;
  editCommentText = '';

  ngOnInit() {
    const postId = history.state?.postId;

    if (postId) {
      this.feedService.getPost(postId).subscribe({
        next: (res) => {
          this.post = res.data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching post', err);
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
        this.feedService.getPost(this.post!.id).subscribe({
          next: (res) => this.post = res.data
        });
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
      },
      error: (error) => console.error('Error updating comment', error)
    });
  }

  deleteComment(comment: Comment): void {
    if (!confirm('Deseja eliminar este comentario?')) return;

    this.feedService.deleteComment(comment.id).subscribe({
      next: () => {
        if (this.post?.comments) {
          this.post.comments = this.post.comments.filter((item) => item.id !== comment.id);
          this.post.comments_count = Math.max(0, this.post.comments_count - 1);
        }
      },
      error: (error) => console.error('Error deleting comment', error)
    });
  }

  private isAdmin(): boolean {
    return String(this.currentUser?.role || '').toLowerCase() === 'admin';
  }
}
