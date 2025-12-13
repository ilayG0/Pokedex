import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class Header {
  isHome = signal(true);
  isMobile = signal(window.innerWidth < 670);

  readonly isMenuOpen = signal(false);

  constructor(private pokemonService: PokemonService) {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 670);
    });
  }

  get count() {
    return this.pokemonService.favoriteCount();
  }

  toggleMenu(): void {
    this.isMenuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
