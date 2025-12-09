import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchBar } from '../../component/search-bar/search-bar.component';
import { Header } from '../../component/header/header.component';
import { PokemonListComponent } from '../../features/pokemon-list/pokemon-list.component';
import { FilterPanelComponent } from '../../component/filter-panel.component/filter-panel.component';

import { Pokemon } from '../../models/pokemon.model';
import { PokemonService } from '../../services/pokemon.service';

@Component({
  selector: 'app-pokemons-home',
  standalone: true,
  imports: [CommonModule, SearchBar, Header, PokemonListComponent, FilterPanelComponent],
  templateUrl: './pokemons-home.component.html',
  styleUrls: ['./pokemons-home.component.scss'],
})
export class PokemonsHome implements OnInit {
  private readonly pokemonService = inject(PokemonService);

  readonly pageSize = 12;

  isLoading = signal(false);
  currentPage = signal(1);

  showFilter = signal(false);

  filters = signal<{ name?: string; height?: number; type?: string; group?: string } | null>(null);
  filterResults = signal<Pokemon[]>([]);

  searchedPokemon = signal<Pokemon | null>(null);
  noResults = signal(false);

  private paginatedPokemons = computed<Pokemon[]>(() => {
    const all = this.pokemonService.pokemons();
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    const end = page * this.pageSize;
    return all.slice(start, end);
  });

  readonly displayedPokemons = computed<Pokemon[]>(() => {
    const filtered = this.filterResults();
    const searched = this.searchedPokemon();

    if (filtered.length > 0) {
      return filtered;
    }

    if (searched) {
      return [searched];
    }

    return this.paginatedPokemons();
  });

  ngOnInit(): void {
    this.loadPage(1);
  }

  // ---- pagination ----

  loadPage(page: number): void {
    const neededCount = page * this.pageSize;
    const alreadyLoaded = this.pokemonService.pokemons().length;

    if (alreadyLoaded >= neededCount) {
      this.currentPage.set(page);
      return;
    }

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

  // ---- filters overlay ----

  onToggleFiltersForm(): void {
    this.showFilter.update((v) => !v);
  }
  
  onFilterSubmit(form: any): void {
    this.isLoading.set(true);

    const mapped = {
      name: form.name,
      height: form.height ? Number(form.height) : undefined,
      type: form.type,
      group: form.group,
    };

    this.filters.set(mapped);
    this.searchedPokemon.set(null);
    this.filterResults.set([]);
    this.noResults.set(false);

    this.pokemonService.searchPokemonsWithFilters(mapped).subscribe({
      next: (result) => {
        this.filterResults.set(result);
        this.isLoading.set(false);
        this.showFilter.set(false);
        this.noResults.set(result.length === 0);
      },
      error: () => {
        this.filterResults.set([]);
        this.isLoading.set(false);
        this.noResults.set(true);
      },
    });
  }


  onFiltersCancel(): void {
    this.showFilter.set(false);
  }

  // ---- search bar (single Pokémon search) ----

   onFoundPokemon(pokemon: Pokemon | null): void {
    if (!pokemon) {
      this.searchedPokemon.set(null);
      this.filterResults.set([]);
      this.noResults.set(true);
      return;
    }

    this.noResults.set(false);
    this.searchedPokemon.set(pokemon);
    this.filterResults.set([]);
    this.currentPage.set(1);
  }

    onReset(): void {
    this.noResults.set(false);
    this.filterResults.set([]);
    this.searchedPokemon.set(null);
    this.filters.set(null);
    this.currentPage.set(1);

    if (this.pokemonService.pokemons().length === 0) {
      this.loadPage(1);
    }
  }

}
