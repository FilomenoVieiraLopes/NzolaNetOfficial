import { Component, Input } from '@angular/core';
import { UserProfile } from '../../../../services/user.service';

@Component({
  selector: 'app-about',
  standalone: true,
  templateUrl: './about.component.html'
})
export class AboutComponent {
  @Input() profile: UserProfile | null = null;

}