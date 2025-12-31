import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { Pokemon } from '../../models/pokemon.model';
import { PokemonIdPipe } from '../../pipes/pokemon-id.pipe';
import { CapitalizeFirstLetterPipe } from '../../pipes/capitalize-first-letter.pipe';
import { PokemonService } from '../../services/pokemon.service';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { statsLeft, statsRight } from './pokemon-stats-consts';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [CommonModule, PokemonIdPipe, CapitalizeFirstLetterPipe, LoadingPokeBall],
  templateUrl: './pokemon-card.component.html',
  styleUrl: './pokemon-card.component.scss',
})
export class PokemonCard {
  @Input({ required: true }) pokemon!: Pokemon;
  @Input({ required: true }) page!: 'home' | 'favorite' | 'info';
  @Input() addCancelBtn = false;

  @Output() pokemonToRemove = new EventEmitter<Pokemon>();

  readonly statsLeft = statsLeft;
  readonly statsRight = statsRight;

  private readonly pokemonService = inject(PokemonService);
  private readonly router = inject(Router);

  getStat(statKey: string): number | string {
    if (!this.pokemon?.stats || !this.pokemon.stats.length) return '-';

    const stat = this.pokemon.stats.find((s) => s.name === statKey);
    return typeof stat?.base_stat === 'number' ? stat.base_stat : '-';
  }

  get totalStats(): number {
    if (!this.pokemon?.stats || !this.pokemon.stats.length) return 0;

    return this.pokemon.stats.reduce(
      (sum, s) => sum + (typeof s.base_stat === 'number' ? s.base_stat : 0),
      0
    );
  }

  onRemove(): void {
    this.pokemonToRemove.emit(this.pokemon);
  }

  goToPokemonFromHome(id: number): void {
    this.router.navigate(['/pokemon-info', id]);
  }

  private goToPokemonFromFavorite(id: number): void {
    this.router.navigate(['/pokemon-info', id], {
      queryParams: { isFromFavorite: true },
    });
  }

  goToPokemon(id: number): void {
    if (this.page === 'home') {
      this.goToPokemonFromHome(id);
    } else if (this.page === 'favorite') {
      this.goToPokemonFromFavorite(id);
    }
  }

  onToggleFavorite(pokemon: Pokemon): void {
    const previousLiked = !!pokemon.isFavorit;
    const newLiked = !previousLiked;

    pokemon.isFavorit = newLiked;

    this.pokemonService
      .toggleFavorite(pokemon.pokedexId, previousLiked)
      .pipe(take(1))
      .subscribe({
        error: (err) => {
          console.error('Failed to toggle favorite', err);
          pokemon.isFavorit = previousLiked;
        },
      });
  }
}
