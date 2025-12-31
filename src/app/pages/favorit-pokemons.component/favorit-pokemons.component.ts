import { Component, computed, inject, OnInit } from '@angular/core';
import { PokemonCard } from '../../component/pokemon-card/pokemon-card.component';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonErrorNotificationComponent } from '../../shared/pokemon-error-notification.component/pokemon-error-notification.component';
import { take } from 'rxjs';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';

@Component({
  selector: 'app-favorit-pokemons.component',
  imports: [PokemonCard, PokemonErrorNotificationComponent, LoadingPokeBall],
  templateUrl: './favorit-pokemons.component.html',
  styleUrl: './favorit-pokemons.component.scss',
  host: {
    '[class.has-items]': 'hasItems()',
  },
})
export class FavoritPokemonsComponent implements OnInit {
  private readonly pokemonService = inject(PokemonService);

  readonly favorites = this.pokemonService.favorites;
  readonly isLoading = this.pokemonService.isFavoritesLoading;
  readonly hasItems = computed(() => this.favorites().length > 0);

  ngOnInit(): void {
    this.pokemonService.loadFavorites();
  }

  onRemoveFavorite(pokemon: Pokemon): void {
    this.pokemonService
      .toggleFavorite(pokemon.pokedexId, true)
      .pipe(take(1))
      .subscribe({
        error: (err) => {
          console.error('Failed to remove favorite', err);
        },
      });
  }
}
