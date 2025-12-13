import { Component, signal } from '@angular/core';
import {  RouterLink, RouterLinkActive } from '@angular/router';
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

  constructor(private pokemonService: PokemonService) {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 670);
    });
  }

  get count() {
    return this.pokemonService.favoriteCount();
  }
}
