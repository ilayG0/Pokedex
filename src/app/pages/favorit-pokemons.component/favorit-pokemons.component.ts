import { Component, computed, inject, OnInit } from '@angular/core';
import { PokemonCard } from '../../component/pokemon-card /pokemon-card.component';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';
import { Router } from '@angular/router';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { PokemonErrorNotificationComponent } from '../../shared/pokemon-error-notification.component/pokemon-error-notification.component';

@Component({
  selector: 'app-favorit-pokemons.component',
  imports: [PokemonCard, LoadingPokeBall, PokemonErrorNotificationComponent],
  templateUrl: './favorit-pokemons.component.html',
  styleUrl: './favorit-pokemons.component.scss',
  host: {
    '[class.has-items]': 'hasItems()',
  },
})
export class FavoritPokemonsComponent implements OnInit {
  pokemonService = inject(PokemonService);
  private readonly router = inject(Router);

  favorites = this.pokemonService.favoritePokemons;
  favoriteIds = this.pokemonService.favoriteIds;
  pokemons = this.pokemonService.pokemons;

  isLoading = computed(() => this.favoriteIds().length > 0 && this.pokemons().length === 0);
  hasItems = computed(() => this.favorites().length > 0);

  ngOnInit() {
   // this.pokemonService.ensurePokemonsLoadedUpTo(1);
  }

  onRemoveFavorite(pokemon: Pokemon) {
    this.pokemonService.toggleFavorite(pokemon);
  }
}
