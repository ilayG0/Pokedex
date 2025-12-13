import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonCard } from '../../component/pokemon-card /pokemon-card.component';
import { PokemonErrorNotificationComponent } from '../../shared/pokemon-error-notification.component/pokemon-error-notification.component';
import { Location } from '@angular/common';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-pokemon-info',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingPokeBall,
    PokemonCard,
    PokemonErrorNotificationComponent,
  ],
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
    const isFromFavorite = query.get('isFromFavorite') === 'true';
    this.isFromFavorite = isFromFavorite;
    
    this.pokemonService.getPokemon(id).subscribe({
      next: (p) => {
        this.pokemon = p;
        this.totalStats = this.calculateTotalStats(p);
        this.description = p.description || '';
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading pokemon', err);
        this.isLoading.set(false);
        this.errorLoadingPokemon = true;
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
