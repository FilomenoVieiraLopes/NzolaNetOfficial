import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-definicao',
  imports: [CommonModule, RouterLink],
  templateUrl: './definicao.component.html',
  styleUrl: './definicao.component.css'
})
export class DefinicaoComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  currentUser: User | null = null;
  isDarkMode = false;
  isDeletingAccount = false;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isDarkMode = document.documentElement.classList.contains('dark');
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('dark', this.isDarkMode);
    document.body.classList.toggle('dark', this.isDarkMode);
    document.body.classList.toggle('bg-gray-900', this.isDarkMode);
  }

  logout(): void {
    this.authService.logout();
  }

  deleteAccount(): void {
    if (!this.currentUser || this.isDeletingAccount) return;

    this.toast.confirm({
      title: 'Apagar conta',
      message: 'Tens a certeza que desejas apagar a tua conta? Esta acao remove o perfil, publicacoes, comentarios e nao pode ser desfeita.',
      confirmText: 'Apagar conta',
      tone: 'danger',
    }).subscribe((confirmed) => {
      if (!confirmed || !this.currentUser) return;

      this.isDeletingAccount = true;
      this.userService.deleteUser(this.currentUser.id).subscribe({
        next: () => {
          this.toast.success('Conta apagada com sucesso.');
          this.authService.logout();
        },
        error: (error) => {
          this.isDeletingAccount = false;
          this.toast.error(this.toast.errorMessage(error, 'Nao foi possivel apagar a conta.'));
        }
      });
    });
  }
}
