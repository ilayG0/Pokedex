import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { Pokemon } from '../../models/pokemon.model';

@Component({
  selector: 'app-pokemon-info',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingPokeBall],
  templateUrl: './pokemon-info.component.html',
})
export class PokemonInfoComponent {
  private route = inject(ActivatedRoute);
  private pokemonService = inject(PokemonService);

  pokemon!: Pokemon;
  isLoading = signal(true);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.pokemonService.getPokemon(id).subscribe((p) => {
      this.pokemon = p;
      this.isLoading.set(false);
    });
  }
}
