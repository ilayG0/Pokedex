import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchBar } from '../../component/search-bar/search-bar.component';
import { Header } from '../../component/header/header.component';
import { PokemonListComponent } from '../../features/pokemon-list/pokemon-list.component';
import { FilterPanelComponent } from '../../component/filter-panel.component/filter-panel.component';

import { Pokemon } from '../../models/pokemon.model';
import { PokemonService } from '../../services/pokemon.service';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { Router } from '@angular/router';

export interface PokemonFilters {
  name?: string;
  height?: number;
  type?: string;
  group?: string;
  color?: string;
}

@Component({
  selector: 'app-pokemons-home',
  standalone: true,
  imports: [CommonModule, SearchBar, PokemonListComponent, FilterPanelComponent, LoadingPokeBall],
  templateUrl: './pokemons-home.component.html',
  styleUrls: ['./pokemons-home.component.scss'],
})
export class PokemonsHome implements OnInit {
  private readonly pokemonService = inject(PokemonService);
  private readonly router = inject(Router);

  isLoading = signal(false);
  showFilter = signal(false);

  filters = signal<PokemonFilters | null>(null);
  noResults = signal(false);

  allPokemons = signal<Pokemon[]>([]);
  displayedPokemons = signal<Pokemon[]>([]);

  ngOnInit(): void {
    this.isLoading.set(true);
    this.pokemonService.getAllPokemons().subscribe({
      next: (pokemons) => {
        this.allPokemons.set(pokemons);
        this.displayedPokemons.set(pokemons);
        this.noResults.set(pokemons.length === 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.allPokemons.set([]);
        this.displayedPokemons.set([]);
        this.noResults.set(true);
        this.isLoading.set(false);
      },
    });
  }

  onToggleFiltersForm(): void {
    this.showFilter.update((v) => !v);
  }

  onFilterSubmit(filters: PokemonFilters): void {
    this.isLoading.set(true);
    this.filters.set(filters);
    this.noResults.set(false);

    this.pokemonService.searchPokemonsByFilters(filters).subscribe({
      next: (result) => {
        this.displayedPokemons.set(result);
        console.log(filters);
        this.router.navigate(['/search'], {
          queryParams: {
            height: filters.height || null,
            group: filters.group || null,
            type: filters.type || null,
            color: filters.color || null,
          },
        });
        this.noResults.set(result.length === 0);
        this.isLoading.set(false);
        this.showFilter.set(false);
      },
      error: () => {
        this.displayedPokemons.set([]);
        this.noResults.set(true);
        this.isLoading.set(false);
      },
    });
  }

  onFiltersCancel(): void {
    this.showFilter.set(false);
  }

  onFoundPokemon(searchString: string): void {
    const term = searchString.trim();

    if (!term) {
      this.displayedPokemons.set(this.allPokemons());
      this.noResults.set(this.allPokemons().length === 0);
      this.filters.set(null);
      return;
    }

    this.isLoading.set(true);
    this.noResults.set(false);
    this.filters.set(null);

    this.pokemonService.filterPokemonsByNameOrId(term).subscribe({
      next: (result) => {
        this.displayedPokemons.set(result);
        this.noResults.set(result.length === 0);
         this.router.navigate(['/search'], {
          queryParams: {
            nameOrId: term || null,
          },
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.displayedPokemons.set([]);
        this.noResults.set(true);
        this.isLoading.set(false);
      },
    });
  }

  onReset(): void {
    this.filters.set(null);
    this.noResults.set(this.allPokemons().length === 0);
    this.displayedPokemons.set(this.allPokemons());
  }
}
