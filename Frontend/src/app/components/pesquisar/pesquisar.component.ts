import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-pesquisar',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pesquisar.component.html',
  styleUrl: './pesquisar.component.css'
})
export class PesquisarComponent {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);

  query = '';
  users: User[] = [];
  isLoading = false;
  message = '';
  error = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const initialQuery = this.route.snapshot.queryParamMap.get('q');

    if (initialQuery) {
      this.query = initialQuery;
      this.search();
    }
  }

  scheduleSearch(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => this.search(), 350);
  }

  follow(user: User): void {
    this.userService.follow(user.id).subscribe({
      next: (response) => {
        this.message = response.message;
        this.error = '';
      },
      error: (error) => {
        this.error = error?.error?.message || 'Nao foi possivel seguir este utilizador.';
        this.message = '';
      }
    });
  }

  private search(): void {
    if (!this.query.trim()) {
      this.users = [];
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.message = '';
    this.userService.searchUsers(this.query).subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error searching users', error);
        this.error = 'Nao foi possivel pesquisar agora.';
        this.isLoading = false;
      }
    });
  }
}
