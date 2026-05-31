import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-definicao',
  imports: [CommonModule, RouterLink],
  templateUrl: './definicao.component.html',
  styleUrl: './definicao.component.css'
})
export class DefinicaoComponent implements OnInit {
  private authService = inject(AuthService);
  isDarkMode = false;
  user: User | null = null;

  ngOnInit() {
    this.isDarkMode = document.documentElement.classList.contains('dark');
    this.user = this.authService.getCurrentUser();
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      // Adicionar classe dark ao body também para garantir fundos se necessário
      document.body.classList.add('dark', 'bg-gray-900');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark', 'bg-gray-900');
    }
  }

  logout() {
    this.authService.logout();
  }
}
