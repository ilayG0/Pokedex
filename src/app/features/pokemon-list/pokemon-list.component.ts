import { Component, OnInit, inject, signal, computed, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonPreviewCard } from '../../component/pokemon-preview-card/pokemon-preview-card.component';
import { Router } from '@angular/router';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, PokemonPreviewCard, LoadingPokeBall],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.scss'],
})
export class PokemonListComponent implements OnInit {
  // loading state
  isLoading = signal(false);

  // pagination
  readonly pageSize = 12;
  currentPage = signal(1);

  private readonly pokemonService = inject(PokemonService);
  private readonly router = inject(Router);

  // computed list for current page (taken from service's pokemons signal)
  paginatedPokemons = computed<Pokemon[]>(() => {
    const all = this.pokemonService.pokemons();
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    const end = page * this.pageSize;
    return all.slice(start, end);
  });

  constructor() {
    // run AFTER the initial change detection has finished
    afterNextRender(() => {
      this.loadPage(1);
    });
  }
  ngOnInit(): void { }
  
  /**
   * Loads a specific page (1-based), using pokemons from the service.
   * If not enough pokemons are loaded, calls loadMorePokemons().
   */
  loadPage(page: number): void {
    const neededCount = page * this.pageSize;
    const alreadyLoaded = this.pokemonService.pokemons().length;

    // if we already have enough Pokémon in cache – just change page
    if (alreadyLoaded >= neededCount) {
      this.currentPage.set(page);
      return;
    }

    // otherwise, load more from API
    this.isLoading.set(true);
    this.pokemonService.loadMorePokemons().subscribe({
      next: () => {
        this.currentPage.set(page);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  nextPage(): void {
    this.loadPage(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.loadPage(this.currentPage() - 1);
    }
  }

  // navigate to pokemon info page
  goToPokemon(id: number): void {
    this.router.navigate(['/pokemon-info', id]);
  }
}
