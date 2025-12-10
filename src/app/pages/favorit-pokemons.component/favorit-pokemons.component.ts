import { Component, inject } from '@angular/core';
import { PokemonPreviewCard } from '../../component/pokemon-preview-card/pokemon-preview-card.component';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-favorit-pokemons.component',
  imports: [PokemonPreviewCard, RouterLink],
  templateUrl: './favorit-pokemons.component.html',
  styleUrl: './favorit-pokemons.component.scss',
})
export class FavoritPokemonsComponent {
  pokemonService = inject(PokemonService);
  private readonly router = inject(Router);
  favorites = this.pokemonService.favoritePokemons;

  onRemoveFavorite(pokemon: Pokemon) {
    this.pokemonService.toggleFavorite(pokemon);
  }

  goToPokemon(id: number): void {
    let isFromFavorite = true;
    this.router.navigate(['/pokemon-info', id], {
      queryParams: { isFromFavorite },
    });
  }
}
