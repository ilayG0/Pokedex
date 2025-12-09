import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Pokemon } from '../../models/pokemon.model';
import { PokemonPreviewCard } from '../../component/pokemon-preview-card/pokemon-preview-card.component';
import { LoadingPokeBall } from "../../shared/loading-poke-ball/loading-poke-ball.component";

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, PokemonPreviewCard, LoadingPokeBall],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.scss'],
})
export class PokemonListComponent {
  @Input() pokemons: Pokemon[] = [];

  private readonly router = inject(Router);

  goToPokemon(id: number): void {
    this.router.navigate(['/pokemon-info', id]);
  }
}
