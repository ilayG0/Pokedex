import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Pokemon } from '../../models/pokemon.model';
import { PokemonPreviewCard } from '../../component/pokemon-preview-card/pokemon-preview-card.component';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { PokemonCard } from "../../component/pokemon-card /pokemon-card.component";

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, PokemonPreviewCard, LoadingPokeBall, PokemonCard],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.scss'],
})
export class PokemonListComponent {

  readonly pageSize = 12;
  currentPage = signal(1);

  private _pokemons: Pokemon[] = [];

  @Input()
  set pokemons(value: Pokemon[]) {
    this._pokemons = value ?? [];
    // whenever the list changes (filter/search), go back to first page
    this.currentPage.set(1);
  }

  get pokemons(): Pokemon[] {
    return this._pokemons;
  }

  // Pokémon shown on current page
  get displayedPokemons(): Pokemon[] {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this._pokemons.slice(start, end);
  }

  get totalPages(): number {
    if (!this._pokemons.length) return 1;
    return Math.ceil(this._pokemons.length / this.pageSize);
  }



  nextPage(): void {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update((p) => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }
}
