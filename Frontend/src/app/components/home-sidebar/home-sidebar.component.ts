import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-home-sidebar',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home-sidebar.component.html'
})
export class HomeSidebarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  currentUser = this.authService.getCurrentUser();
  searchQuery = '';
  searchResults: User[] = [];
  isSearching = false;
  searchError = '';
  suggestedUsers: User[] = [];
  isLoadingSuggestions = false;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadSuggestions();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  scheduleSearch(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);

    const term = this.searchQuery.trim();
    if (!term) {
      this.clearSearchResults();
      return;
    }

    this.searchTimer = setTimeout(() => this.searchUsers(term), 350);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.clearSearchResults();
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  followUser(user: User, source: 'search' | 'suggestions'): void {
    this.userService.follow(user.id).subscribe({
      next: (response) => {
        if (source === 'search') {
          this.searchResults = this.searchResults.filter((item) => item.id !== user.id);
        } else {
          this.suggestedUsers = this.suggestedUsers.filter((item) => item.id !== user.id);
        }

        this.toast.success(response.status === 'pending' ? 'Pedido para seguir enviado.' : 'Utilizador seguido com sucesso.');
      },
      error: (error) => this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel seguir este utilizador.'))
    });
  }

  private clearSearchResults(): void {
    this.searchResults = [];
    this.searchError = '';
    this.isSearching = false;
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
}
