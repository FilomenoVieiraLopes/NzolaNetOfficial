import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { Comment } from '../../models/comment.model';
import { Notification } from '../../models/notification.model';
import { Post } from '../../models/post.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { FeedService } from '../../services/feed.service';
import { NotificationService } from '../../services/notification.service';
import { RealtimeService } from '../../services/realtime.service';
import { ToastService } from '../../services/toast.service';
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
  private realtimeService = inject(RealtimeService);
  private toast = inject(ToastService);
  private router = inject(Router);

  posts: Post[] = [];
  isLoading = true;
  feedMode: 'general' | 'following' = 'general';
  currentPage = 1;
  lastPage = 1;
  isLoadingMore = false;
  currentUser = this.authService.getCurrentUser();
  homeSearchQuery = '';
  searchResults: User[] = [];
  isSearching = false;
  searchError = '';
  suggestedUsers: User[] = [];
  isLoadingSuggestions = false;
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
  openCommentMenuId: number | null = null;
  targetPostId: number | null = null;
  openMenuPostId: number | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private realtimeSubscriptions: Subscription[] = [];
  private pendingBazePostIds = new Set<number>();
  private pendingCommentBazeIds = new Set<number>();

  ngOnInit(): void {
    this.targetPostId = history.state?.postId ? Number(history.state.postId) : null;
    this.loadFeed('general');
    this.loadNotifications();
    this.loadSuggestions();
    this.connectRealtime();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.realtimeSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.realtimeService.disconnect();
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

  loadFeed(mode: 'general' | 'following', page = 1): void {
    this.feedMode = mode;
    this.currentPage = page;
    this.isLoading = true;
    this.isLoadingMore = false;

    const request = mode === 'general'
      ? this.feedService.getPosts(page)
      : this.feedService.getFollowingFeed(page);

    request.subscribe({
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

    const request = this.feedMode === 'general'
      ? this.feedService.getPosts(nextPage)
      : this.feedService.getFollowingFeed(nextPage);

    request.subscribe({
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

  submitInlineComment(post: Post): void {
    const body = (this.commentDrafts[post.id] || '').trim();
    if (!body) return;

    this.feedService.addComment(post.id, body).subscribe({
      next: (response) => {
        post.comments = [...(post.comments || []), response.data];
        post.comments_count += 1;
        this.commentDrafts[post.id] = '';
        this.toast.success('Comentario publicado com sucesso.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel publicar o comentario.'))
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

  saveComment(post: Post, comment: Comment): void {
    const body = this.editCommentText.trim();
    if (!body) return;

    this.feedService.updateComment(comment.id, body).subscribe({
      next: (response) => {
        post.comments = (post.comments || []).map((item) => item.id === comment.id ? response.data : item);
        this.cancelEditComment();
        this.toast.success('Comentario atualizado com sucesso.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel atualizar o comentario.'))
    });
  }

  deleteComment(post: Post, comment: Comment): void {
    this.toast.confirm({
      title: 'Eliminar comentario',
      message: 'Deseja eliminar este comentario?',
      confirmText: 'Eliminar',
      tone: 'danger',
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.feedService.deleteComment(comment.id).subscribe({
        next: () => {
          post.comments = (post.comments || []).filter((item) => item.id !== comment.id);
          post.comments_count = Math.max(0, post.comments_count - 1);
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
      next: (response) => {
        this.searchResults = this.searchResults.filter((item) => item.id !== user.id);
        this.toast.success(response.status === 'pending' ? 'Pedido para seguir enviado.' : 'Utilizador seguido com sucesso.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel seguir este utilizador.'))
    });
  }

  followSuggestedUser(user: User): void {
    this.userService.follow(user.id).subscribe({
      next: (response) => {
        this.suggestedUsers = this.suggestedUsers.filter((item) => item.id !== user.id);
        this.toast.success(response.status === 'pending' ? 'Pedido para seguir enviado.' : 'Utilizador seguido com sucesso.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel seguir este utilizador.'))
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
        this.toast.success('Notificacoes marcadas como lidas.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel marcar as notificacoes como lidas.'))
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

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();

    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter((item) => item.id !== notification.id);
        if (!notification.read) {
          this.unreadNotifications = Math.max(0, this.unreadNotifications - 1);
        }
        this.toast.success('Notificacao eliminada.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel eliminar a notificacao.'))
    });
  }

  acceptFollowRequestFromNotification(notification: Notification, event: Event): void {
    event.stopPropagation();

    if (!notification.actor_id) {
      this.toast.error('Nao foi possivel identificar quem fez o pedido.');
      return;
    }

    this.userService.acceptFollowRequest(notification.actor_id).subscribe({
      next: () => {
        notification.read = true;
        this.notifications = this.notifications.filter((item) => item.id !== notification.id);
        this.unreadNotifications = Math.max(0, this.unreadNotifications - 1);
        this.toast.success('Pedido aceite com sucesso.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel aceitar o pedido.'))
    });
  }

  rejectFollowRequestFromNotification(notification: Notification, event: Event): void {
    event.stopPropagation();

    if (!notification.actor_id) {
      this.toast.error('Nao foi possivel identificar quem fez o pedido.');
      return;
    }

    this.userService.rejectFollowRequest(notification.actor_id).subscribe({
      next: () => {
        notification.read = true;
        this.notifications = this.notifications.filter((item) => item.id !== notification.id);
        this.unreadNotifications = Math.max(0, this.unreadNotifications - 1);
        this.toast.success('Pedido rejeitado.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel rejeitar o pedido.'))
    });
  }

  labelForNotification(type: string): string {
    const labels: Record<string, string> = {
      comment: 'comentou na sua publicacao',
      baze: 'deu baze na sua publicacao',
      comment_baze: 'deu baze no seu comentario',
      follow: 'comecou a seguir voce',
      follow_request: 'pediu para seguir voce',
      follow_accepted: 'aceitou o seu pedido para seguir'
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
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel pesquisar agora.'));
        this.searchError = 'Nao foi possivel pesquisar agora.';
        this.searchResults = [];
        this.isSearching = false;
      }
    });
  }

  private loadSuggestions(): void {
    this.isLoadingSuggestions = true;

    this.userService.getSuggestions().subscribe({
      next: (users) => {
        this.suggestedUsers = users.filter((user) => user.id !== this.currentUser?.id);
        this.isLoadingSuggestions = false;
      },
      error: (error) => {
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar sugestoes de perfis.'));
        this.suggestedUsers = [];
        this.isLoadingSuggestions = false;
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
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar comentarios.'));
        this.loadingComments[post.id] = false;
      }
    });
  }

  private refreshFeed(): void {
    if (this.isLoading || this.isLoadingMore || this.editingPostId) return;

    const pages = Array.from({ length: this.currentPage }, (_, index) => index + 1);
    const requests = pages.map((page) => this.feedMode === 'general'
      ? this.feedService.getPosts(page)
      : this.feedService.getFollowingFeed(page)
    );

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

  private connectRealtime(): void {
    this.realtimeService.connect(this.currentUser?.id);

    this.realtimeSubscriptions.push(
      this.realtimeService.notificationCreated$.subscribe((notification) => {
        const alreadyExists = this.notifications.some((item) => item.id === notification.id);
        this.notifications = [notification, ...this.notifications]
          .filter((item, index, list) => list.findIndex((current) => current.id === item.id) === index)
          .slice(0, 5);
        if (!alreadyExists && !notification.read) {
          this.unreadNotifications += 1;
        }
      })
    );

    this.realtimeSubscriptions.push(
      this.realtimeService.feedUpdated$.subscribe(() => {
        this.refreshFeed();
        this.refreshOpenComments();
      })
    );
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
