import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonPreviewCard } from '../../component/pokemon-preview-card/pokemon-preview-card.component';
import { PokemonMainInfoComponent } from './pokemon-main-info.component/pokemon-main-info.component';
import { PokemonStatsDetailsComponent } from './pokemon-stats-details.component/pokemon-stats-details.component';
import { PokemonIdPipe } from '../../pipes/pokemon-id.pipe';
import { PokemonCard } from "../../component/pokemon-card /pokemon-card.component";

@Component({
  selector: 'app-pokemon-info',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingPokeBall,
    PokemonPreviewCard,
    PokemonMainInfoComponent,
    PokemonStatsDetailsComponent,
    PokemonIdPipe,
    PokemonCard
],
  templateUrl: './pokemon-info.component.html',
  styleUrl: './pokemon-info.component.scss',
})
export class PokemonInfoComponent {
  private route = inject(ActivatedRoute);
  private pokemonService = inject(PokemonService);

  pokemon!: Pokemon;
  isLoading = signal(true);
  description = '';
  isFromFavorite = false;

  totalStats = 0;

  onToggleFavorite(pokemon: Pokemon) {
    this.pokemon.isFavorit = !this.pokemon.isFavorit;
    this.pokemonService.toggleFavorite(pokemon);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.isFromFavorite = params['isFromFavorite'] === 'true';
      console.log('isFromFavorite:', this.isFromFavorite, params['isFromFavorite']);
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    this.isLoading.set(true);

    this.pokemonService.getPokemon(id).subscribe({
      next: (p) => {
        this.pokemon = p;
        console.log(p)
        this.totalStats = this.calculateTotalStats(p);
        this.description = p.description || '';
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading pokemon', err);
        this.isLoading.set(false);
      },
    });
  }

  getStat(name: string): number | '-' {
    if (!this.pokemon) return '-';
    const stat = this.pokemon.stats.find((s) => s.stat.name === name);
    return stat ? stat.base_stat : '-';
  }

  private calculateTotalStats(pokemon: Pokemon): number {
    return pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);
  }
}
