import { Component } from '@angular/core';

@Component({
  selector: 'app-pesquisar',
  imports: [],
  templateUrl: './pesquisar.component.html',
  styleUrl: './pesquisar.component.css'
})
export class PesquisarComponent {

  users = [
    {
      id:1,
      img:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      name:'Julian Vance',
      role:'Creative Director @ CraftFlow',
      isVerified: false,
      isFollowing: false
    },
    {
      id:2,
      img:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      name:'Elena Rodriguez',
      role:'Senior Product Designer',
      isVerified: true,
      isFollowing: true
    },
    {
      id:3,
      img:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      name:'Marcus Chen',
      role:'Venture Partner @ NzolaCap',
      isVerified: false,
      isFollowing: false
    }
    ,
    {
      id:4,
      img:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      name:'Marcus Chen',
      role:'Venture Partner @ NzolaCap',
      isVerified: false,
      isFollowing: false
    },
     {
      id:5,
      img:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      name:'Marcus Chen',
      role:'Venture Partner @ NzolaCap',
      isVerified: false,
      isFollowing: false
    }
  ];


}
