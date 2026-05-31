import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedService } from '../../services/feed.service';
import { Post } from '../../models/post.model';
import { Comment } from '../../models/comment.model';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification.model';

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
  editingPostId: number | null = null;
  editingContent = '';
  commentDrafts: Record<number, string> = {};
  editingCommentId: number | null = null;
  editingCommentBody = '';
  currentUser = this.authService.getCurrentUser();
  homeSearchQuery = '';
  searchResults: User[] = [];
  isSearching = false;
  searchError = '';
  notifications: Notification[] = [];
  unreadNotifications = 0;
  showNotifications = false;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private notificationTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.loadFeed('general');
    this.loadNotifications();
    this.notificationTimer = setInterval(() => this.loadNotifications(false), 30000);
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    if (this.notificationTimer) {
      clearInterval(this.notificationTimer);
    }
  }

  loadFeed(mode: 'general' | 'following') {
    this.feedMode = mode;
    this.isLoading = true;

    const request = mode === 'general'
      ? this.feedService.getPosts()
      : this.feedService.getFollowingFeed();

    request.subscribe({
      next: (response) => {
        this.posts = response.data;
        this.isLoading = false;
        this.posts.forEach((post) => {
          this.commentDrafts[post.id] = this.commentDrafts[post.id] || '';
          this.loadComments(post);
        });
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
      },
      error: (error) => console.error('Error giving baze', error)
    });
  }

  startEdit(post: Post): void {
    this.editingPostId = post.id;
    this.editingContent = post.content;
  }

  cancelEdit(): void {
    this.editingPostId = null;
    this.editingContent = '';
  }

  saveEdit(post: Post): void {
    if (!this.editingContent.trim()) {
      return;
    }

    this.feedService.updatePost(post.id, this.editingContent).subscribe({
      next: (response) => {
        Object.assign(post, response.data);
        this.cancelEdit();
      },
      error: (error) => console.error('Error updating post', error)
    });
  }

  deletePost(post: Post): void {
    if (!confirm('Tens certeza que queres apagar esta publicacao?')) {
      return;
    }

    this.feedService.deletePost(post.id).subscribe({
      next: () => this.posts = this.posts.filter((item) => item.id !== post.id),
      error: (error) => console.error('Error deleting post', error)
    });
  }

  submitComment(post: Post): void {
    const body = this.commentDrafts[post.id]?.trim();

    if (!body) {
      return;
    }

    this.feedService.addComment(post.id, body).subscribe({
      next: (response) => {
        post.comments = [...(post.comments || []), response.data];
        post.comments_count++;
        this.commentDrafts[post.id] = '';
      },
      error: (error) => console.error('Error adding comment', error)
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
      next: (response) => {
        comment.body = response.data.body;
        this.cancelCommentEdit();
      },
      error: (error) => console.error('Error updating comment', error)
    });
  }

  deleteComment(post: Post, comment: Comment): void {
    if (!confirm('Tens certeza que queres apagar este comentario?')) {
      return;
    }

    this.feedService.deleteComment(comment.id).subscribe({
      next: () => {
        post.comments = (post.comments || []).filter((item) => item.id !== comment.id);
        post.comments_count = Math.max(0, post.comments_count - 1);
      },
      error: (error) => console.error('Error deleting comment', error)
    });
  }

  scheduleHomeSearch(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

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

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  followUser(user: User): void {
    this.userService.follow(user.id).subscribe({
      next: () => this.searchResults = this.searchResults.filter((item) => item.id !== user.id),
      error: (error) => console.error('Error following user', error)
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;

    if (this.showNotifications) {
      this.loadNotifications(false);
    }
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) => ({
          ...notification,
          read: true
        }));
        this.unreadNotifications = 0;
      },
      error: (error) => console.error('Error marking notifications as read', error)
    });
  }

  openNotification(notification: Notification): void {
    const goToTarget = () => {
      this.showNotifications = false;

      if (notification.post_id) {
        this.router.navigate(['/app/home']);
        return;
      }

      if (notification.actor_id) {
        this.router.navigate(['/app/perfil', notification.actor_id]);
        return;
      }

      this.router.navigate(['/app/notificacoes']);
    };

    if (notification.read) {
      goToTarget();
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.unreadNotifications = Math.max(0, this.unreadNotifications - 1);
        goToTarget();
      },
      error: (error) => {
        console.error('Error marking notification as read', error);
        goToTarget();
      }
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

  private loadNotifications(showLoadingErrors = true): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications.slice(0, 5);
        this.unreadNotifications = notifications.filter((notification) => !notification.read).length;
      },
      error: (error) => {
        if (showLoadingErrors) {
          console.error('Error loading notifications', error);
        }
      }
    });
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

  private loadComments(post: Post): void {
    this.feedService.getComments(post.id).subscribe({
      next: (response) => post.comments = response.data,
      error: (error) => console.error('Error loading comments', error)
    });
  }
}
