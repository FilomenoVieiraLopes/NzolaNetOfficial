import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { Post } from '../../models/post.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { FeedService } from '../../services/feed.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, RouterModule, FormsModule],
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
  isFollowing = false;
  isFollowLoading = false;
  editingPostId: number | null = null;
  editPostContent = '';

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

  private loadProfile(userId: number): void {
    this.isLoading = true;
    this.error = '';
    this.user = null;
    this.posts = [];
    this.followersCount = 0;
    this.followingCount = 0;
    this.isOwnProfile = Number(this.currentUser?.id) === Number(userId);

    this.userService.getUser(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.isOwnProfile = Number(this.currentUser?.id) === Number(user.id);
        if (this.isOwnProfile) this.authService.setCurrentUser(user);
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
      next: (followers) => {
        this.followersCount = followers.length;
        // Verificar se o currentUser está a seguir este perfil
        if (this.currentUser) {
          this.isFollowing = followers.some(f => f.id === this.currentUser?.id);
        }
      },
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

  canEditPost(post: Post): boolean {
    return !!post.can_edit || Number(post.user_id) === Number(this.currentUser?.id);
  }

  canDeletePost(post: Post): boolean {
    return !!post.can_delete || Number(post.user_id) === Number(this.currentUser?.id) || this.isAdmin();
  }

  startEditPost(post: Post): void {
    this.editingPostId = post.id;
    this.editPostContent = post.content;
  }

  cancelEditPost(): void {
    this.editingPostId = null;
    this.editPostContent = '';
  }

  savePost(post: Post): void {
    const content = this.editPostContent.trim();
    if (!content) return;

    this.feedService.updatePost(post.id, { content }).subscribe({
      next: (response) => {
        this.posts = this.posts.map((item) => item.id === post.id ? response.data : item);
        this.cancelEditPost();
      },
      error: (error) => console.error('Error updating post', error)
    });
  }

  deletePost(post: Post): void {
    if (!confirm('Deseja eliminar esta publicacao?')) return;

    this.feedService.deletePost(post.id).subscribe({
      next: () => this.posts = this.posts.filter((item) => item.id !== post.id),
      error: (error) => console.error('Error deleting post', error)
    });
  }

  followUser(): void {
    if (!this.user || this.isFollowLoading) return;

    this.isFollowLoading = true;
    this.userService.follow(this.user.id).subscribe({
      next: () => {
        this.isFollowing = true;
        this.followersCount += 1;
        this.isFollowLoading = false;
      },
      error: (error) => {
        console.error('Error following user', error);
        this.isFollowLoading = false;
      }
    });
  }

  unfollowUser(): void {
    if (!this.user || this.isFollowLoading) return;

    this.isFollowLoading = true;
    this.userService.unfollow(this.user.id).subscribe({
      next: () => {
        this.isFollowing = false;
        this.followersCount = Math.max(0, this.followersCount - 1);
        this.isFollowLoading = false;
      },
      error: (error) => {
        console.error('Error unfollowing user', error);
        this.isFollowLoading = false;
      }
    });
  }

  private isAdmin(): boolean {
    return String(this.currentUser?.role || '').toLowerCase() === 'admin';
  }
}
