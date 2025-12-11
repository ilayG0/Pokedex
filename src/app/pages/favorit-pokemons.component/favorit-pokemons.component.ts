import { Component, computed, inject } from '@angular/core';
import { PokemonCard } from '../../component/pokemon-card /pokemon-card.component';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';
import { Router, RouterLink } from '@angular/router';
import { LoadingPokeBall } from "../../shared/loading-poke-ball/loading-poke-ball.component";

@Component({
  selector: 'app-favorit-pokemons.component',
  imports: [PokemonCard, RouterLink, LoadingPokeBall],
  templateUrl: './favorit-pokemons.component.html',
  styleUrl: './favorit-pokemons.component.scss',
})
export class FavoritPokemonsComponent {
  pokemonService = inject(PokemonService);
  private readonly router = inject(Router);

    favorites = this.pokemonService.favoritePokemons;
  favoriteIds = this.pokemonService.favoriteIds;
  pokemons = this.pokemonService.pokemons;

  // 👇 מצב טעינה דינמי
  isLoading = computed(() =>
    this.favoriteIds().length > 0 && this.pokemons().length === 0
  );

  ngOnInit(): void {
    // לוודא שהפוקימונים נטענים (גם אם מישהו נכנס ישר לפייבוריטס)
    this.pokemonService.getAllPokemons().subscribe();
  }
  
  onRemoveFavorite(pokemon: Pokemon) {
    this.pokemonService.toggleFavorite(pokemon);
  }

}
