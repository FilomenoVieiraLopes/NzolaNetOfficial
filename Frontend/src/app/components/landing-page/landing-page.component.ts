import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  standalone: true,
  selector: 'app-landing-page',
  imports: [RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {

}
