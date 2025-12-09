import { Component, inject, signal } from '@angular/core';
import { PokemonPreviewCard } from "../../component/pokemon-preview-card/pokemon-preview-card.component";
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';

@Component({
  selector: 'app-favorit-pokemons.component',
  imports: [PokemonPreviewCard],
  templateUrl: './favorit-pokemons.component.html',
  styleUrl: './favorit-pokemons.component.scss',
})
export class FavoritPokemonsComponent {
  pokemonService = inject(PokemonService);

  favorites = this.pokemonService.favoritePokemons;

  onRemoveFavorite(pokemon: Pokemon) {
    this.pokemonService.toggleFavorite(pokemon);
  }
}


