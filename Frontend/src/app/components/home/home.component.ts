import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Notification } from '../../models/notification.model';
import { Post } from '../../models/post.model';
import { HomeNotificationsComponent } from '../home-notifications/home-notifications.component';
import { HomeSidebarComponent } from '../home-sidebar/home-sidebar.component';
import { PostCommentsComponent } from '../post-comments/post-comments.component';
import { AuthService } from '../../services/auth.service';
import { FeedService } from '../../services/feed.service';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';

type FeedMode = 'general' | 'following';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule, DatePipe, FormsModule, HomeNotificationsComponent, HomeSidebarComponent, PostCommentsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private feedService = inject(FeedService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);
  private router = inject(Router);

  posts: Post[] = [];
  isLoading = true;
  feedMode: FeedMode = 'general';
  currentPage = 1;
  lastPage = 1;
  isLoadingMore = false;
  currentUser = this.authService.getCurrentUser();
  notifications: Notification[] = [];
  unreadNotifications = 0;
  showNotifications = false;
  editingPostId: number | null = null;
  editPostContent = '';
  openCommentPostIds = new Set<number>();
  loadingComments: Record<number, boolean> = {};
  targetPostId: number | null = null;
  openMenuPostId: number | null = null;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private pendingBazePostIds = new Set<number>();

  ngOnInit(): void {
    this.targetPostId = history.state?.postId ? Number(history.state.postId) : null;
    this.loadFeed('general');
    this.loadNotifications();
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
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

  loadFeed(mode: FeedMode, page = 1): void {
    this.feedMode = mode;
    this.currentPage = page;
    this.isLoading = true;
    this.isLoadingMore = false;

    this.getFeedPosts(page).subscribe({
      next: (response) => {
        this.posts = this.mergePosts(response.data);
        this.applyPagination(response.meta);
        this.openAndLoadComments(this.posts);
        this.isLoading = false;
        this.focusTargetPost();
      },
      error: (error) => {
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar as publicacoes.'));
        this.isLoading = false;
      }
    });
  }

  loadMorePosts(): void {
    if (this.isLoading || this.isLoadingMore || this.currentPage >= this.lastPage) return;

    const nextPage = this.currentPage + 1;
    this.isLoadingMore = true;

    this.getFeedPosts(nextPage).subscribe({
      next: (response) => {
        this.posts = this.mergePosts([...this.posts, ...response.data]);
        this.applyPagination(response.meta);
        this.openAndLoadComments(response.data);
        this.isLoadingMore = false;
      },
      error: (error) => {
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar mais publicacoes.'));
        this.isLoadingMore = false;
      }
    });
  }

  giveBaze(post: Post): void {
    if (this.pendingBazePostIds.has(post.id)) return;

    this.pendingBazePostIds.add(post.id);
    const request = post.has_bazed
      ? this.feedService.removeBaze(post.id)
      : this.feedService.giveBaze(post.id);

    request.subscribe({
      next: () => {
        post.has_bazed = !post.has_bazed;
        post.bazes_count = Math.max(0, post.bazes_count + (post.has_bazed ? 1 : -1));
        this.pendingBazePostIds.delete(post.id);
      },
      error: (error) => {
        this.pendingBazePostIds.delete(post.id);
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel atualizar o baze.'));
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
    this.openMenuPostId = null;
  }

  toggleMenu(postId: number): void {
    this.openMenuPostId = this.openMenuPostId === postId ? null : postId;
  }

  closeMenu(): void {
    this.openMenuPostId = null;
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
        this.toast.success('Publicacao atualizada com sucesso.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel atualizar a publicacao.'))
    });
  }

  deletePost(post: Post): void {
    this.toast.confirm({
      title: 'Eliminar publicacao',
      message: 'Deseja eliminar esta publicacao? Esta acao nao pode ser desfeita.',
      confirmText: 'Eliminar',
      tone: 'danger',
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.feedService.deletePost(post.id).subscribe({
        next: () => {
          this.posts = this.posts.filter((item) => item.id !== post.id);
          this.toast.success('Publicacao eliminada com sucesso.');
        },
        error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel eliminar a publicacao.'))
      });
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

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) this.loadNotifications(false);
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) => ({ ...notification, read: true }));
        this.unreadNotifications = 0;
        this.toast.success('Notificacoes marcadas como lidas.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel marcar as notificacoes como lidas.'))
    });
  }

  openNotification(notification: Notification): void {
    if (notification.read) {
      this.goToNotificationTarget(notification);
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.unreadNotifications = Math.max(0, this.unreadNotifications - 1);
        this.goToNotificationTarget(notification);
      },
      error: () => this.goToNotificationTarget(notification)
    });
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();

    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.removeNotification(notification);
        this.toast.success('Notificacao eliminada.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel eliminar a notificacao.'))
    });
  }

  acceptFollowRequestFromNotification(notification: Notification, event: Event): void {
    this.answerFollowRequest(notification, event, 'accept');
  }

  rejectFollowRequestFromNotification(notification: Notification, event: Event): void {
    this.answerFollowRequest(notification, event, 'reject');
  }

  private answerFollowRequest(notification: Notification, event: Event, action: 'accept' | 'reject'): void {
    event.stopPropagation();

    if (!notification.actor_id) {
      this.toast.error('Nao foi possivel identificar quem fez o pedido.');
      return;
    }

    const request = action === 'accept'
      ? this.userService.acceptFollowRequest(notification.actor_id)
      : this.userService.rejectFollowRequest(notification.actor_id);

    request.subscribe({
      next: () => {
        this.removeNotification(notification);
        this.toast.success(action === 'accept' ? 'Pedido aceite com sucesso.' : 'Pedido rejeitado.');
      },
      error: (error) => {
        const fallback = action === 'accept'
          ? 'Nao foi possivel aceitar o pedido.'
          : 'Nao foi possivel rejeitar o pedido.';

        this.toast.error(this.toast.errorMessage(error, fallback));
      }
    });
  }

  isAdmin(): boolean {
    return String(this.currentUser?.role || '').toLowerCase() === 'admin';
  }

  private getFeedPosts(page: number) {
    return this.feedMode === 'general'
      ? this.feedService.getPosts(page)
      : this.feedService.getFollowingFeed(page);
  }

  private removeNotification(notification: Notification): void {
    this.notifications = this.notifications.filter((item) => item.id !== notification.id);

    if (!notification.read) {
      this.unreadNotifications = Math.max(0, this.unreadNotifications - 1);
    }

    notification.read = true;
  }

  private goToNotificationTarget(notification: Notification): void {
    this.showNotifications = false;

    if (notification.post_id) {
      this.targetPostId = notification.post_id;
      this.focusTargetPost();
      this.router.navigate(['/app/home'], { state: { postId: notification.post_id } });
      return;
    }

    if (notification.actor_id) {
      this.router.navigate(['/app/perfil', notification.actor_id]);
      return;
    }

    this.router.navigate(['/app/notificacoes']);
  }

  private loadComments(post: Post): void {
    this.loadingComments[post.id] = true;

    this.feedService.getComments(post.id).subscribe({
      next: (response) => {
        post.comments = response.data;
        this.loadingComments[post.id] = false;
      },
      error: (error) => {
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar comentarios.'));
        this.loadingComments[post.id] = false;
      }
    });
  }

  private refreshFeed(): void {
    if (this.isLoading || this.isLoadingMore || this.editingPostId) return;

    const pages = Array.from({ length: this.currentPage }, (_, index) => index + 1);
    const requests = pages.map((page) => this.getFeedPosts(page));

    forkJoin(requests).subscribe({
      next: (responses) => {
        const latestResponse = responses[responses.length - 1];
        this.posts = this.mergePosts(responses.flatMap((response) => response.data));
        this.applyPagination(latestResponse?.meta);
        this.openAndLoadComments(this.posts);
      },
      error: () => {}
    });
  }

  private refreshOpenComments(): void {
    this.posts
      .filter((post) => this.openCommentPostIds.has(post.id) && !this.loadingComments[post.id])
      .forEach((post) => {
        this.feedService.getComments(post.id).subscribe({
          next: (response) => post.comments = response.data,
          error: () => {}
        });
      });
  }

  private startPolling(): void {
    this.pollingTimer = setInterval(() => {
      this.loadNotifications(false);
      this.refreshFeed();
      this.refreshOpenComments();
    }, 15000);
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

  private openAndLoadComments(posts: Post[]): void {
    posts.forEach((post) => {
      this.openCommentPostIds.add(post.id);

      if (!post.comments && !this.loadingComments[post.id]) {
        this.loadComments(post);
      }
    });
  }

  private applyPagination(meta = {
    current_page: 1,
    last_page: 1,
    total: this.posts.length,
  }): void {
    this.currentPage = meta.current_page;
    this.lastPage = meta.last_page;
  }

  private focusTargetPost(): void {
    if (!this.targetPostId) return;

    const post = this.posts.find((item) => item.id === this.targetPostId);
    if (post) {
      this.openCommentPostIds.add(post.id);
      if (!post.comments) {
        this.loadComments(post);
      }
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
        if (showErrors) this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar notificacoes.'));
      }
    });
  }
}
