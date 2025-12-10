import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class Header {

  isHome= signal(true);
  isMobile = window.innerWidth < 760;
  
  onHome(){
    this.isHome.set(true);
  }

  onFavorite(){
    this.isHome.set(false);
  }
}
