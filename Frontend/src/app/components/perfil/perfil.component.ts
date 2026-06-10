import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
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
  private router = inject(Router);

  currentUser = this.authService.getCurrentUser();
  user: User | null = null;
  posts: Post[] = [];
  currentPage = 1;
  lastPage = 1;
  totalPosts = 0;
  isLoadingMore = false;
  followersCount = 0;
  followingCount = 0;
  isLoading = true;
  error = '';
  isOwnProfile = false;
  isFollowing = false;
  followStatus: string | null = null;
  isFollowLoading = false;
  pendingRequests: User[] = [];
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
    this.currentPage = 1;
    this.lastPage = 1;
    this.totalPosts = 0;
    this.isLoadingMore = false;
    this.followersCount = 0;
    this.followingCount = 0;
    this.isOwnProfile = Number(this.currentUser?.id) === Number(userId);
    this.isFollowing = false;
    this.followStatus = null;
    this.pendingRequests = [];

    this.userService.getUser(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.isOwnProfile = Number(this.currentUser?.id) === Number(user.id);
        this.followStatus = user.follow_status ?? null;
        this.isFollowing = this.followStatus === 'accepted';
        this.followersCount = user.followers_count ?? 0;
        this.followingCount = user.following_count ?? 0;
        if (this.isOwnProfile) this.authService.setCurrentUser(user);
        if (this.isOwnProfile) this.loadPendingRequests();

        if (this.canViewPrivateContent()) {
          this.loadProfileStats(user.id);
          this.loadPosts(user.id);
          return;
        }

        this.isLoading = false;
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
          if (this.isFollowing) this.followStatus = 'accepted';
        }
      },
      error: (error) => console.error('Error loading followers', error)
    });

    this.userService.getFollowing(userId).subscribe({
      next: (following) => this.followingCount = following.length,
      error: (error) => console.error('Error loading following', error)
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const threshold = 700;
    const position = window.innerHeight + window.scrollY;
    const height = document.documentElement.scrollHeight;

    if (position >= height - threshold) {
      this.loadMorePosts();
    }
  }

  loadPosts(userId: number, page = 1): void {
    this.currentPage = page;
    this.isLoadingMore = false;
    this.feedService.getUserPosts(userId, page).subscribe({
      next: (response) => {
        this.posts = response.data;
        this.applyPagination(response.meta);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile posts', error);
        this.isLoading = false;
      }
    });
  }

  loadMorePosts(): void {
    if (!this.user || this.isLoading || this.isLoadingMore || this.currentPage >= this.lastPage) return;

    const nextPage = this.currentPage + 1;
    this.isLoadingMore = true;

    this.feedService.getUserPosts(this.user.id, nextPage).subscribe({
      next: (response) => {
        const existingIds = new Set(this.posts.map((post) => post.id));
        const newPosts = response.data.filter((post) => !existingIds.has(post.id));
        this.posts = [...this.posts, ...newPosts];
        this.applyPagination(response.meta);
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('Error loading more profile posts', error);
        this.isLoadingMore = false;
      }
    });
  }

  canEditPost(post: Post): boolean {
    return !!post.can_edit || Number(post.user_id) === Number(this.currentUser?.id);
  }

  canDeletePost(post: Post): boolean {
    return !!post.can_delete || Number(post.user_id) === Number(this.currentUser?.id) || this.isAdmin();
  }

  openPost(post: Post): void {
    this.router.navigate(['/app/comentario'], { state: { postId: post.id } });
  }

  startEditPost(post: Post, event?: Event): void {
    event?.stopPropagation();
    this.editingPostId = post.id;
    this.editPostContent = post.content;
  }

  cancelEditPost(event?: Event): void {
    event?.stopPropagation();
    this.editingPostId = null;
    this.editPostContent = '';
  }

  savePost(post: Post, event?: Event): void {
    event?.stopPropagation();
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

  deletePost(post: Post, event?: Event): void {
    event?.stopPropagation();
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
      next: (response) => {
        this.followStatus = response.status || 'accepted';
        this.isFollowing = this.followStatus === 'accepted';
        if (this.isFollowing) {
          this.followersCount += 1;
          this.loadPosts(this.user!.id, 1);
        }
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

    const wasFollowing = this.isFollowing;
    this.isFollowLoading = true;
    this.userService.unfollow(this.user.id).subscribe({
      next: () => {
        this.isFollowing = false;
        this.followStatus = null;
        this.posts = [];
        if (wasFollowing) {
          this.followersCount = Math.max(0, this.followersCount - 1);
        }
        this.isFollowLoading = false;
      },
      error: (error) => {
        console.error('Error unfollowing user', error);
        this.isFollowLoading = false;
      }
    });
  }

  acceptRequest(request: User): void {
    this.userService.acceptFollowRequest(request.id).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter((item) => item.id !== request.id);
        this.followersCount += 1;
      },
      error: (error) => console.error('Error accepting follow request', error)
    });
  }

  rejectRequest(request: User): void {
    this.userService.rejectFollowRequest(request.id).subscribe({
      next: () => this.pendingRequests = this.pendingRequests.filter((item) => item.id !== request.id),
      error: (error) => console.error('Error rejecting follow request', error)
    });
  }

  canViewPrivateContent(): boolean {
    return !!this.user?.can_view_private_content;
  }

  private loadPendingRequests(): void {
    this.userService.getFollowRequests().subscribe({
      next: (requests) => this.pendingRequests = requests,
      error: (error) => console.error('Error loading follow requests', error)
    });
  }

  private isAdmin(): boolean {
    return String(this.currentUser?.role || '').toLowerCase() === 'admin';
  }

  private applyPagination(meta = {
    current_page: 1,
    last_page: 1,
    total: this.posts.length,
  }): void {
    this.currentPage = meta.current_page;
    this.lastPage = meta.last_page;
    this.totalPosts = meta.total;
  }
}
