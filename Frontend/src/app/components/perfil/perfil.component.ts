import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterLink, RouterModule } from '@angular/router';
import { Post } from '../../models/post.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { FeedService } from '../../services/feed.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, RouterModule],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private feedService = inject(FeedService);
  private route = inject(ActivatedRoute);

  currentUser = this.authService.getCurrentUser();
  user: User | null = null;
  posts: Post[] = [];
  followersCount = 0;
  followingCount = 0;
  isLoading = true;
  error = '';
  isOwnProfile = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.currentUser = this.authService.getCurrentUser();

      if (!this.currentUser) {
        this.isLoading = false;
        return;
      }

      const routeUserId = Number(params.get('id') || this.currentUser.id);
      this.loadProfile(routeUserId);
    });
  }

  loadProfile(userId: number): void {
    this.isLoading = true;
    this.error = '';
    this.user = null;
    this.posts = [];
    this.followersCount = 0;
    this.followingCount = 0;
    this.isOwnProfile = this.currentUser?.id === userId;

    this.userService.getUser(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.isOwnProfile = this.currentUser?.id === user.id;

        if (this.isOwnProfile) {
          this.authService.setCurrentUser(user);
        }

        this.loadProfileStats(user.id);
        this.loadPosts(user.id);
      },
      error: (error) => {
        console.error('Error loading profile', error);
        this.error = error?.error?.message || 'Nao foi possivel carregar este perfil.';
        this.isLoading = false;
      }
    });
  }

  private loadProfileStats(userId: number): void {
    this.userService.getFollowers(userId).subscribe({
      next: (followers) => this.followersCount = followers.length,
      error: (error) => console.error('Error loading followers', error)
    });

    this.userService.getFollowing(userId).subscribe({
      next: (following) => this.followingCount = following.length,
      error: (error) => console.error('Error loading following', error)
    });
  }

  private loadPosts(userId: number): void {
    this.feedService.getUserPosts(userId).subscribe({
      next: (response) => {
        this.posts = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile posts', error);
        this.isLoading = false;
      }
    });
  }
}
