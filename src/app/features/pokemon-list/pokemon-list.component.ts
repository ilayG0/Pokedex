import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonPreviewCard } from '../../component/pokemon-preview-card/pokemon-preview-card.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, PokemonPreviewCard],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.scss'],
})
export class PokemonListComponent implements OnInit {
  pokemons: Pokemon[] = []; // what we show on this page
  isLoading = signal(false);

  currentPage = 1;
  readonly pageSize = 12;

  private readonly pokemonService = inject(PokemonService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadPage(1);
  }

  /**
   * Loads a specific page (1-based), using the cached array from the service.
   * If the data for that page doesn't exist yet, it calls loadMorePokemons().
   */
  loadPage(page: number): void {
    const neededCount = page * this.pageSize;
    const alreadyLoaded = this.pokemonService.cachedPokemons.length;

    // if we already have enough Pokémon in cache – just slice
    if (alreadyLoaded >= neededCount) {
      this.currentPage = page;
      this.updateCurrentPageSlice();
      return;
    }

    // otherwise, load 12 more from API
    this.isLoading.set(true);
    this.pokemonService.loadMorePokemons().subscribe({
      next: () => {
        this.currentPage = page;
        this.updateCurrentPageSlice();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private updateCurrentPageSlice(): void {
    const all = this.pokemonService.cachedPokemons;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = this.currentPage * this.pageSize;
    this.pokemons = all.slice(start, end);
  }

  nextPage(): void {
    this.loadPage(this.currentPage + 1);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.loadPage(this.currentPage - 1);
    }
  }

  // optional helper if you still want it somewhere:
  getIdFromUrl(url: string): number {
    return this.pokemonService.extractIdFromUrl(url);
  }

  // go to the chosen pokemon info page
  goToPokemon(id: number) {
  this.router.navigate(['/pokemon-info', id]);
}
}
