import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostsGridComponent } from '../../features/profile/components/posts-grid/posts-grid.component';
import { HeroSectionComponent } from '../../features/profile/components/hero-section/hero-section.component';
import { AboutComponent } from '../../features/profile/components/bio-section/about.component';
import { TabsComponent } from '../../features/profile/components/tabs/tabs.component';
import { StatsCardComponent } from '../../features/profile/components/stats-card/stats-card.component';
import { UserService, UserProfile } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone:true,

  imports:[
    CommonModule,
    HeroSectionComponent,
    AboutComponent,
    StatsCardComponent,
    TabsComponent,
    PostsGridComponent
  ],

  templateUrl:'./perfil.component.html'
})
export class PerfilComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  profile: UserProfile | null = null;
  followersCount = 0;
  followingCount = 0;
  errorMessage = '';
  loading = true;

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.errorMessage = 'Usuário não autenticado.';
      this.loading = false;
      return;
    }

    this.userService.getProfile(userId).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.followersCount = profile.followers_count ?? 0;
        this.followingCount = profile.following_count ?? 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar perfil:', err);
        this.errorMessage = 'Não foi possível carregar o perfil.';
        this.loading = false;
      }
    });

    this.userService.getFollowers(userId).subscribe({
      next: (followers) => this.followersCount = followers.length,
      error: (err) => console.error('Erro ao carregar seguidores:', err)
    });

    this.userService.getFollowing(userId).subscribe({
      next: (following) => this.followingCount = following.length,
      error: (err) => console.error('Erro ao carregar seguindo:', err)
    });
  }
}
