import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Comment } from '../../models/comment.model';
import { Notification } from '../../models/notification.model';
import { Post } from '../../models/post.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { FeedService } from '../../services/feed.service';
import { NotificationService } from '../../services/notification.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule, DatePipe, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private feedService = inject(FeedService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  posts: Post[] = [];
  isLoading = true;
  feedMode: 'general' | 'following' = 'general';
  currentUser = this.authService.getCurrentUser();
  homeSearchQuery = '';
  searchResults: User[] = [];
  isSearching = false;
  searchError = '';
  notifications: Notification[] = [];
  unreadNotifications = 0;
  showNotifications = false;
  editingPostId: number | null = null;
  editPostContent = '';
  openCommentPostIds = new Set<number>();
  loadingComments: Record<number, boolean> = {};
  commentDrafts: Record<number, string> = {};
  editingCommentId: number | null = null;
  editCommentText = '';
  targetPostId: number | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private notificationTimer: ReturnType<typeof setInterval> | null = null;
  private feedTimer: ReturnType<typeof setInterval> | null = null;
  private commentsTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.targetPostId = history.state?.postId ? Number(history.state.postId) : null;
    this.loadFeed('general');
    this.loadNotifications();
    this.notificationTimer = setInterval(() => this.loadNotifications(false), 10000);
    this.feedTimer = setInterval(() => this.refreshFeed(), 12000);
    this.commentsTimer = setInterval(() => this.refreshOpenComments(), 8000);
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (this.notificationTimer) clearInterval(this.notificationTimer);
    if (this.feedTimer) clearInterval(this.feedTimer);
    if (this.commentsTimer) clearInterval(this.commentsTimer);
  }

  loadFeed(mode: 'general' | 'following'): void {
    this.feedMode = mode;
    this.isLoading = true;

    const request = mode === 'general'
      ? this.feedService.getPosts()
      : this.feedService.getFollowingFeed();

    request.subscribe({
      next: (response) => {
        this.posts = this.mergePosts(response.data);
        this.posts.forEach((post) => this.openCommentPostIds.add(post.id));
        this.isLoading = false;
        this.focusTargetPost();
      },
      error: (error) => {
        console.error('Error fetching posts', error);
        this.isLoading = false;
      }
    });
  }

  giveBaze(post: Post): void {
    const request = post.has_bazed
      ? this.feedService.removeBaze(post.id)
      : this.feedService.giveBaze(post.id);

    request.subscribe({
      next: () => {
        post.has_bazed = !post.has_bazed;
        post.bazes_count += post.has_bazed ? 1 : -1;
        this.loadNotifications(false);
      },
      error: (error) => console.error('Error giving baze', error)
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

  toggleComments(post: Post): void {
    if (this.openCommentPostIds.has(post.id)) {
      this.openCommentPostIds.delete(post.id);
      return;
    }

    this.openCommentPostIds.add(post.id);
    if (!post.comments) {
      this.loadComments(post);
    }
  }

  isCommentsOpen(post: Post): boolean {
    return this.openCommentPostIds.has(post.id);
  }

  submitInlineComment(post: Post): void {
    const body = (this.commentDrafts[post.id] || '').trim();
    if (!body) return;

    this.feedService.addComment(post.id, body).subscribe({
      next: (response) => {
        post.comments = [...(post.comments || []), response.data];
        post.comments_count += 1;
        this.commentDrafts[post.id] = '';
        this.loadNotifications(false);
      },
      error: (error) => console.error('Error adding comment', error)
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

  saveComment(post: Post, comment: Comment): void {
    const body = this.editCommentText.trim();
    if (!body) return;

    this.feedService.updateComment(comment.id, body).subscribe({
      next: (response) => {
        post.comments = (post.comments || []).map((item) => item.id === comment.id ? response.data : item);
        this.cancelEditComment();
      },
      error: (error) => console.error('Error updating comment', error)
    });
  }

  deleteComment(post: Post, comment: Comment): void {
    if (!confirm('Deseja eliminar este comentario?')) return;

    this.feedService.deleteComment(comment.id).subscribe({
      next: () => {
        post.comments = (post.comments || []).filter((item) => item.id !== comment.id);
        post.comments_count = Math.max(0, post.comments_count - 1);
      },
      error: (error) => console.error('Error deleting comment', error)
    });
  }

  scheduleHomeSearch(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const term = this.homeSearchQuery.trim();

    if (!term) {
      this.searchResults = [];
      this.searchError = '';
      this.isSearching = false;
      return;
    }

    this.searchTimer = setTimeout(() => this.searchUsers(term), 350);
  }

  clearHomeSearch(): void {
    this.homeSearchQuery = '';
    this.searchResults = [];
    this.searchError = '';
    this.isSearching = false;
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  followUser(user: User): void {
    this.userService.follow(user.id).subscribe({
      next: () => this.searchResults = this.searchResults.filter((item) => item.id !== user.id),
      error: (error) => console.error('Error following user', error)
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) this.loadNotifications(false);
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) => ({ ...notification, read: true }));
        this.unreadNotifications = 0;
      },
      error: (error) => console.error('Error marking notifications as read', error)
    });
  }

  openNotification(notification: Notification): void {
    const finish = () => {
      this.showNotifications = false;
      if (notification.post_id) {
        this.targetPostId = notification.post_id;
        this.focusTargetPost();
        this.router.navigate(['/app/home'], { state: { postId: notification.post_id } });
      } else if (notification.actor_id) {
        this.router.navigate(['/app/perfil', notification.actor_id]);
      } else {
        this.router.navigate(['/app/notificacoes']);
      }
    };

    if (notification.read) {
      finish();
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.unreadNotifications = Math.max(0, this.unreadNotifications - 1);
        finish();
      },
      error: () => finish()
    });
  }

  labelForNotification(type: string): string {
    const labels: Record<string, string> = {
      comment: 'comentou na sua publicacao',
      baze: 'deu baze na sua publicacao',
      follow: 'comecou a seguir voce'
    };

    return labels[type] ?? `nova notificacao: ${type}`;
  }

  private searchUsers(term: string): void {
    this.isSearching = true;
    this.searchError = '';

    this.userService.searchUsers(term).subscribe({
      next: (users) => {
        this.searchResults = users.filter((user) => user.id !== this.currentUser?.id);
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error searching users', error);
        this.searchError = 'Nao foi possivel pesquisar agora.';
        this.searchResults = [];
        this.isSearching = false;
      }
    });
  }

  private isAdmin(): boolean {
    return String(this.currentUser?.role || '').toLowerCase() === 'admin';
  }

  private loadComments(post: Post): void {
    this.loadingComments[post.id] = true;

    this.feedService.getComments(post.id).subscribe({
      next: (response) => {
        post.comments = response.data;
        this.loadingComments[post.id] = false;
      },
      error: (error) => {
        console.error('Error loading comments', error);
        this.loadingComments[post.id] = false;
      }
    });
  }

  private refreshFeed(): void {
    if (this.isLoading || this.editingPostId) return;

    const request = this.feedMode === 'general'
      ? this.feedService.getPosts()
      : this.feedService.getFollowingFeed();

    request.subscribe({
      next: (response) => {
        this.posts = this.mergePosts(response.data);
        this.posts.forEach((post) => this.openCommentPostIds.add(post.id));
      },
      error: (error) => console.error('Error refreshing feed', error)
    });
  }

  private refreshOpenComments(): void {
    this.posts
      .filter((post) => this.openCommentPostIds.has(post.id) && !this.loadingComments[post.id])
      .forEach((post) => {
        this.feedService.getComments(post.id).subscribe({
          next: (response) => post.comments = response.data,
          error: (error) => console.error('Error refreshing comments', error)
        });
      });
  }

  private mergePosts(freshPosts: Post[]): Post[] {
    return freshPosts.map((freshPost) => {
      const currentPost = this.posts.find((post) => post.id === freshPost.id);
      if (!currentPost) return freshPost;

      return {
        ...freshPost,
        comments: currentPost.comments,
      };
    });
  }

  private focusTargetPost(): void {
    if (!this.targetPostId) return;

    const post = this.posts.find((item) => item.id === this.targetPostId);
    if (post) {
      this.openCommentPostIds.add(post.id);
    }

    setTimeout(() => {
      document.getElementById(`post-${this.targetPostId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  }

  private loadNotifications(showErrors = true): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications.slice(0, 5);
        this.unreadNotifications = notifications.filter((notification) => !notification.read).length;
      },
      error: (error) => {
        if (showErrors) console.error('Error loading notifications', error);
      }
    });
  }
}
