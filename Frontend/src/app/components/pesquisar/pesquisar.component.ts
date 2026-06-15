import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { User } from '../../models/user.model';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-pesquisar',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pesquisar.component.html',
  styleUrl: './pesquisar.component.css'
})
export class PesquisarComponent {
  private userService = inject(UserService);
  private toast = inject(ToastService);
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
        this.toast.success(response.status === 'pending' ? 'Pedido para seguir enviado.' : 'Utilizador seguido com sucesso.');
      },
      error: (error) => {
        this.error = this.toast.errorMessage(error, 'Nao foi possivel seguir este utilizador.');
        this.message = '';
        this.toast.error(this.error);
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
        this.error = this.toast.errorMessage(error, 'Nao foi possivel pesquisar agora.');
        this.toast.error(this.error);
        this.isLoading = false;
      }
    });
  }
}
