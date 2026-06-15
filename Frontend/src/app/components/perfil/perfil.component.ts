import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { Post } from '../../models/post.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { FeedService } from '../../services/feed.service';
import { ToastService } from '../../services/toast.service';
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
  private toast = inject(ToastService);
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
  processingRequestIds = new Set<number>();
  hasPendingRequestFromProfile = false;
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
    this.resetProfileState(userId);

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
        if (!this.isOwnProfile) this.checkPendingRequestFromProfile(user.id);

        if (this.canViewPrivateContent()) {
          this.loadProfileStats(user.id);
          this.loadPosts(user.id);
          return;
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.error = this.toast.errorMessage(error, 'Nao foi possivel carregar este perfil.');
        this.toast.error(this.error);
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
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar seguidores.'))
    });

    this.userService.getFollowing(userId).subscribe({
      next: (following) => this.followingCount = following.length,
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar perfis seguidos.'))
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
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar publicacoes do perfil.'));
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
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar mais publicacoes.'));
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
        this.toast.success('Publicacao atualizada com sucesso.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel atualizar a publicacao.'))
    });
  }

  deletePost(post: Post, event?: Event): void {
    event?.stopPropagation();
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
        this.toast.success(this.followStatus === 'pending' ? 'Pedido para seguir enviado.' : 'Utilizador seguido com sucesso.');
      },
      error: (error) => {
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel seguir este utilizador.'));
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
        this.toast.success('Deixaste de seguir este utilizador.');
      },
      error: (error) => {
        this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel deixar de seguir este utilizador.'));
        this.isFollowLoading = false;
      }
    });
  }

  acceptRequest(request: User): void {
    this.answerRequest(request, 'accept');
  }

  acceptProfileRequest(): void {
    if (!this.user) return;

    this.acceptRequest(this.user);
  }

  rejectProfileRequest(): void {
    if (!this.user) return;

    this.rejectRequest(this.user);
  }

  rejectRequest(request: User): void {
    this.answerRequest(request, 'reject');
  }

  private answerRequest(request: User, action: 'accept' | 'reject'): void {
    if (this.processingRequestIds.has(request.id)) return;

    this.processingRequestIds.add(request.id);

    const apiRequest = action === 'accept'
      ? this.userService.acceptFollowRequest(request.id)
      : this.userService.rejectFollowRequest(request.id);

    apiRequest.subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter((item) => item.id !== request.id);
        if (action === 'accept') {
          this.followersCount += 1;
        }

        this.processingRequestIds.delete(request.id);
        this.loadPendingRequests(false);
        this.toast.success(action === 'accept' ? 'Pedido aceite com sucesso.' : 'Pedido rejeitado.');
      },
      error: (error) => {
        this.processingRequestIds.delete(request.id);
        const fallback = action === 'accept'
          ? 'Nao foi possivel aceitar o pedido.'
          : 'Nao foi possivel rejeitar o pedido.';

        this.toast.error(this.toast.errorMessage(error, fallback));
      }
    });
  }

  canViewPrivateContent(): boolean {
    return !!this.user?.can_view_private_content;
  }

  private loadPendingRequests(showError = true): void {
    this.userService.getFollowRequests().subscribe({
      next: (requests) => this.pendingRequests = requests,
      error: (error) => {
        if (showError) this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel carregar pedidos para seguir.'));
      }
    });
  }

  private checkPendingRequestFromProfile(profileUserId: number): void {
    this.userService.getFollowRequests().subscribe({
      next: (requests) => {
        this.hasPendingRequestFromProfile = requests.some((request) => Number(request.id) === Number(profileUserId));
      },
      error: () => {
        this.hasPendingRequestFromProfile = false;
      }
    });
  }

  private isAdmin(): boolean {
    return String(this.currentUser?.role || '').toLowerCase() === 'admin';
  }

  private resetProfileState(userId: number): void {
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
    this.processingRequestIds.clear();
    this.hasPendingRequestFromProfile = false;
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
