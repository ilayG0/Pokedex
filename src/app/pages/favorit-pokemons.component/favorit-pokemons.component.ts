import { Component, inject } from '@angular/core';
import { PokemonCard } from '../../component/pokemon-card /pokemon-card.component';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-favorit-pokemons.component',
  imports: [ PokemonCard, RouterLink],
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

}
