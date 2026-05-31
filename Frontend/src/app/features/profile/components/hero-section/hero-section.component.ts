import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserProfile } from '../../../../services/user.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.css'
})
export class HeroSectionComponent {
  @Input() profile: UserProfile | null = null;
}
