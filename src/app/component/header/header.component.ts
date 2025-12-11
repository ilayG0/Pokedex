import { Component, signal } from '@angular/core';
import { RouterLink ,RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive ],
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class Header {
  isHome = signal(true);
  isMobile = signal(window.innerWidth < 670);

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 670);
    });
  }
}
