import { Component, OnInit, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedService } from '../../services/feed.service';
import { Post } from '../../models/post.model';
import { Comment } from '../../models/comment.model';

@Component({
  selector: 'app-comentario',
  imports: [RouterModule, CommonModule, FormsModule, DatePipe],
  templateUrl: './comentario.component.html',
  styleUrl: './comentario.component.css'
})
export class ComentarioComponent implements OnInit {
  private feedService = inject(FeedService);
  private router = inject(Router);

  post: Post | null = null;
  isLoading = true;
  commentText = '';
  editingCommentId: number | null = null;
  editingCommentBody = '';
  editingPost = false;
  editingPostContent = '';

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
    const currentPost = this.post;

    this.feedService.addComment(this.post.id, this.commentText).subscribe({
      next: (res) => {
        currentPost.comments = currentPost.comments || [];
        currentPost.comments.push(res.data);
        currentPost.comments_count++;
        this.commentText = '';
      }
    });
  }

  startPostEdit(): void {
    if (!this.post) {
      return;
    }

    this.editingPost = true;
    this.editingPostContent = this.post.content;
  }

  cancelPostEdit(): void {
    this.editingPost = false;
    this.editingPostContent = '';
  }

  savePostEdit(): void {
    if (!this.post || !this.editingPostContent.trim()) {
      return;
    }

    this.feedService.updatePost(this.post.id, this.editingPostContent).subscribe({
      next: (res) => {
        this.post = {
          ...res.data,
          comments: this.post?.comments || []
        };
        this.cancelPostEdit();
      },
      error: (error) => console.error('Error updating post', error)
    });
  }

  deletePost(): void {
    if (!this.post || !confirm('Tens certeza que queres apagar esta publicacao?')) {
      return;
    }

    this.feedService.deletePost(this.post.id).subscribe({
      next: () => this.router.navigate(['/app/home']),
      error: (error) => console.error('Error deleting post', error)
    });
  }

  startCommentEdit(comment: Comment): void {
    this.editingCommentId = comment.id;
    this.editingCommentBody = comment.body;
  }

  cancelCommentEdit(): void {
    this.editingCommentId = null;
    this.editingCommentBody = '';
  }

  saveCommentEdit(comment: Comment): void {
    if (!this.editingCommentBody.trim()) {
      return;
    }

    this.feedService.updateComment(comment.id, this.editingCommentBody).subscribe({
      next: (res) => {
        comment.body = res.data.body;
        this.cancelCommentEdit();
      },
      error: (error) => console.error('Error updating comment', error)
    });
  }

  deleteComment(comment: Comment): void {
    if (!this.post || !confirm('Tens certeza que queres apagar este comentario?')) {
      return;
    }

    this.feedService.deleteComment(comment.id).subscribe({
      next: () => {
        if (!this.post) {
          return;
        }

        this.post.comments = (this.post.comments || []).filter((item) => item.id !== comment.id);
        this.post.comments_count = Math.max(0, this.post.comments_count - 1);
      },
      error: (error) => console.error('Error deleting comment', error)
    });
  }
}
