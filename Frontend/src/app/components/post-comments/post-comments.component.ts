import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Comment } from '../../models/comment.model';
import { Post } from '../../models/post.model';
import { User } from '../../models/user.model';
import { FeedService } from '../../services/feed.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-post-comments',
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './post-comments.component.html'
})
export class PostCommentsComponent {
  private feedService = inject(FeedService);
  private toast = inject(ToastService);

  @Input({ required: true }) post!: Post;
  @Input() currentUser: User | null = null;
  @Input() loading = false;
  @Input() isAdmin = false;

  commentDraft = '';
  replyDrafts: Record<number, string> = {};
  replyingToCommentId: number | null = null;
  editingCommentId: number | null = null;
  editCommentText = '';
  openCommentMenuId: number | null = null;
  private pendingCommentBazeIds = new Set<number>();

  submitComment(): void {
    const body = this.commentDraft.trim();
    if (!body) return;

    this.feedService.addComment(this.post.id, body).subscribe({
      next: (response) => {
        this.addComment(response.data);
        this.commentDraft = '';
        this.toast.success('Comentario publicado com sucesso.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel publicar o comentario.'))
    });
  }

  topLevelComments(): Comment[] {
    return (this.post.comments || []).filter((comment) => !comment.parent_id);
  }

  commentReplies(comment: Comment): Comment[] {
    return (this.post.comments || []).filter((reply) => Number(reply.parent_id) === Number(comment.id));
  }

  startReply(comment: Comment): void {
    this.replyingToCommentId = comment.id;
    this.replyDrafts[comment.id] = this.replyDrafts[comment.id] || '';
    this.openCommentMenuId = null;
  }

  cancelReply(): void {
    this.replyingToCommentId = null;
  }

  submitReply(comment: Comment): void {
    const body = (this.replyDrafts[comment.id] || '').trim();
    if (!body) return;

    this.feedService.addComment(this.post.id, body, comment.id).subscribe({
      next: (response) => {
        this.addComment(response.data);
        this.replyDrafts[comment.id] = '';
        this.replyingToCommentId = null;
        this.toast.success('Resposta publicada com sucesso.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel publicar a resposta.'))
    });
  }

  canEditComment(comment: Comment): boolean {
    return !!comment.can_edit || Number(comment.user_id) === Number(this.currentUser?.id);
  }

  canDeleteComment(comment: Comment): boolean {
    return !!comment.can_delete || Number(comment.user_id) === Number(this.currentUser?.id) || this.isAdmin;
  }

  startEditComment(comment: Comment): void {
    this.editingCommentId = comment.id;
    this.editCommentText = comment.body;
    this.openCommentMenuId = null;
  }

  toggleCommentMenu(commentId: number): void {
    this.openCommentMenuId = this.openCommentMenuId === commentId ? null : commentId;
  }

  closeCommentMenu(): void {
    this.openCommentMenuId = null;
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
        this.post.comments = (this.post.comments || []).map((item) => item.id === comment.id ? response.data : item);
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
          this.removeComment(comment);
          this.toast.success('Comentario eliminado com sucesso.');
        },
        error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel eliminar o comentario.'))
      });
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

  private addComment(comment: Comment): void {
    this.post.comments = [...(this.post.comments || []), comment];
    this.post.comments_count += 1;
  }

  private removeComment(comment: Comment): void {
    const comments = this.post.comments || [];
    const removedCount = comments.filter((item) => item.id === comment.id || item.parent_id === comment.id).length;

    this.post.comments = comments.filter((item) => item.id !== comment.id && item.parent_id !== comment.id);
    this.post.comments_count = Math.max(0, this.post.comments_count - removedCount);
  }
}
