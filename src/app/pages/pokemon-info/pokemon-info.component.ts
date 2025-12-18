import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { CommonModule } from '@angular/common';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonCard } from '../../component/pokemon-card /pokemon-card.component';
import { PokemonErrorNotificationComponent } from '../../shared/pokemon-error-notification.component/pokemon-error-notification.component';
import { Location } from '@angular/common';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-pokemon-info',
  standalone: true,
  imports: [CommonModule, LoadingPokeBall, PokemonCard, PokemonErrorNotificationComponent],
  templateUrl: './pokemon-info.component.html',
  styleUrl: './pokemon-info.component.scss',
})
export class PokemonInfoComponent {
  private route = inject(ActivatedRoute);
  private pokemonService = inject(PokemonService);
  private readonly location = inject(Location);

  pokemon!: Pokemon;
  isLoading = signal(true);
  description = '';
  isFromFavorite = false;
  errorLoadingPokemon = false;
  totalStats = 0;

ngOnInit(): void {
  this.isLoading.set(true);

  combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, query]) => {
    const id = Number(params.get('id'));
    this.isFromFavorite = query.get('isFromFavorite') === 'true';

    this.pokemonService.getPokemonByNameOrId(id).subscribe({
      next: (pokemon) => {
        this.pokemon = pokemon;
        this.totalStats = this.calculateTotalStats(pokemon);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorLoadingPokemon = true;
        this.isLoading.set(false);
      },
    });
  });
}


  private calculateTotalStats(pokemon: Pokemon): number {
    return pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);
  }
  onGoBack() {
    this.location.back();
  }
}
