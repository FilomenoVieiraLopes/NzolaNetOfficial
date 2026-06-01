import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-definicao',
  imports: [CommonModule, RouterLink],
  templateUrl: './definicao.component.html',
  styleUrl: './definicao.component.css'
})
export class DefinicaoComponent implements OnInit {
  private authService = inject(AuthService);

  currentUser: User | null = null;
  isDarkMode = false;

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
}
