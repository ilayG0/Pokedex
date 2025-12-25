import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { CommonModule } from '@angular/common';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonCard } from '../../component/pokemon-card/pokemon-card.component';
import { Location } from '@angular/common';
import { combineLatest } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-pokemon-info',
  standalone: true,
  imports: [CommonModule, LoadingPokeBall, PokemonCard],
  templateUrl: './pokemon-info.component.html',
  styleUrls: ['./pokemon-info.component.scss'],
})
export class PokemonInfoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly pokemonService = inject(PokemonService);
  private readonly location = inject(Location);

  pokemon = signal<Pokemon | null>(null);
  isLoading = signal(true);

  isFromFavorite = false;
  isLiked = false;
  totalStats = 0;

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, query]) => {
      const id = Number(params.get('id'));
      this.isFromFavorite = query.get('isFromFavorite') === 'true';

      if (Number.isNaN(id)) {
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);

      this.pokemonService
        .getPokemonByNameOrId(id)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (pokemon) => {
            this.pokemon.set(pokemon);
            this.totalStats = this.calculateTotalStats(pokemon);

            this.pokemonService.isFavorite(pokemon.pokedexId).subscribe((liked) => {
              this.isLiked = liked;
              this.pokemon.update((current) =>
                current ? { ...current, isFavorit: liked } : current
              );
            });
          },
          error: (err) => {
            console.error('Failed to load pokemon', err);
          },
        });
    });
  }

  private calculateTotalStats(pokemon: Pokemon): number {
    if (!pokemon.stats) return 0;

    return Object.values(pokemon.stats).reduce(
      (sum, v) => sum + (typeof v === 'number' ? v : 0),
      0
    );
  }

  onGoBack() {
    this.location.back();
  }
}
