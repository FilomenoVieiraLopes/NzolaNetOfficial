import { Component, OnInit, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedService } from '../../services/feed.service';
import { Post } from '../../models/post.model';

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
      }
    });
  }
}
