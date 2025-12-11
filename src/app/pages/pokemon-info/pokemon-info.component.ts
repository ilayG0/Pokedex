import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonCard } from "../../component/pokemon-card /pokemon-card.component";

@Component({
  selector: 'app-pokemon-info',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingPokeBall,
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

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.isFromFavorite = params['isFromFavorite'] === 'true';
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    this.isLoading.set(true);

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
      },
    });
  }

  private calculateTotalStats(pokemon: Pokemon): number {
    return pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);
  }
}
