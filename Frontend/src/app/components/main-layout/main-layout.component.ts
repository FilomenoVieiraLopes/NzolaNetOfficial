import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  standalone:true,
  imports:[
    RouterOutlet,
    RouterLink,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl:'./main-layout.component.html'
})
export class MainLayoutComponent {}