import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FeedService } from '../../services/feed.service';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule, DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private feedService = inject(FeedService);
  posts: Post[] = [];
  isLoading = true;

  ngOnInit() {
    this.feedService.getPosts().subscribe({
      next: (response) => {
        this.posts = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching posts', error);
        this.isLoading = false;
      }
    });
  }
}
