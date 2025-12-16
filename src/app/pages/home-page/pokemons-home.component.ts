import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchBar } from '../../component/search-bar/search-bar.component';
import { PokemonListComponent } from '../../features/pokemon-list/pokemon-list.component';
import { FilterPanelComponent } from '../../component/filter-panel.component/filter-panel.component';
import { PokemonFilters } from '../../models/pokemon-filters.model';

import { Pokemon } from '../../models/pokemon.model';
import { PokemonService } from '../../services/pokemon.service';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { ActivatedRoute, Router } from '@angular/router';

import { finalize, of, Subject, switchMap, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-pokemons-home',
  standalone: true,
  imports: [CommonModule, SearchBar, PokemonListComponent, FilterPanelComponent, LoadingPokeBall],
  templateUrl: './pokemons-home.component.html',
  styleUrls: ['./pokemons-home.component.scss'],
})
export class PokemonsHome implements OnInit {
  readonly pokemonService = inject(PokemonService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isLoading = this.pokemonService.isLoadingPage();
  showFilter = signal(false);

  filters = signal<PokemonFilters | null>(null);
  noResults = signal(false);

  private readonly searchResult = signal<Pokemon[] | null>(null);

  readonly displayedPokemons = computed(
    () => this.searchResult() ?? this.pokemonService.pokemons()
  );
  readonly displayedLoadPokemonsBtn = computed(
    () => !this.searchResult() || this.searchResult()!.length === 0
  );

  ngOnInit(): void {
    const initialQp = this.route.snapshot.queryParams;
    if (this.route.snapshot.routeConfig?.path === 'search' && !('page' in initialQp)) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: 1 },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }

    this.pokemonService.load12Pokemons();
  }

  onLoad12Pokemons(): void {
    this.searchResult.set(null);
    this.noResults.set(false);
    this.pokemonService.load12Pokemons();
  }

  onSearchPokemonByNameOrId(nameOrId: string): void {
    const q = nameOrId.trim();
    if (!q) {
      this.searchResult.set(null);
      this.noResults.set(false);
      return;
    }

    this.noResults.set(false);

    this.pokemonService.getPokemonByNameOrId(q).subscribe({
      next: (p) => {
        this.searchResult.set([p]);
      },
      error: (err) => {
        console.error('Error loading pokemon', err);
        this.searchResult.set([]);
        this.noResults.set(true);
      },
    });
  }

  /* 
  private listenToQueryParams(): void {
    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        switchMap((qp) => {
          const keys = Object.keys(qp ?? {});
          const onlyPage = keys.length === 1 && keys[0] === 'page';

          if (!qp || keys.length === 0 || onlyPage) {
            this.filters.set(null);
            const all = this.allPokemons();
            this.noResults.set(all.length === 0);
            return of(all);
          }

          if (qp['nameOrId']) {
            this.filters.set(null);
            this.noResults.set(false);
            this.isLoading.set(true);

            return this.pokemonService
              .filterPokemonsByNameOrId(qp['nameOrId'])
              .pipe(finalize(() => this.isLoading.set(false)));
          }

          const filters: PokemonFilters = {
            height: qp['height'] ? Number(qp['height']) : undefined,
            group: qp['group'] ?? undefined,
            type: qp['type'] ?? undefined,
            color: qp['color'] ?? undefined,
          };

          this.filters.set(filters);
          this.noResults.set(false);
          this.isLoading.set(true);

          return this.pokemonService
            .searchPokemonsByFilters(filters)
            .pipe(finalize(() => this.isLoading.set(false)));
        })
      )
      .subscribe((result) => {
        this.displayedPokemons.set(result);
        this.noResults.set(result.length === 0);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        this.noResults.set(result.length === 0);
        this.isLoading.set(false);
        this.showFilter.set(false);

        this.router.navigate(['/home'], {
          queryParams: {
            search : true,
            page: 1,
            ...(filters.height != null ? { height: filters.height } : {}),
            ...(filters.group ? { group: filters.group } : {}),
            ...(filters.type ? { type: filters.type } : {}),
            ...(filters.color ? { color: filters.color } : {}),
          },
        });
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
      this.filters.set(null);
      this.displayedPokemons.set(this.allPokemons());
      this.noResults.set(this.allPokemons().length === 0);

      this.router.navigate(['/home'], { queryParams: { page: 1 } });
      return;
    }

    this.isLoading.set(true);
    this.noResults.set(false);
    this.filters.set(null);

    this.pokemonService.filterPokemonsByNameOrId(term).subscribe({
      next: (result) => {
        this.displayedPokemons.set(result);
        this.noResults.set(result.length === 0);
        this.isLoading.set(false);

        this.router.navigate(['/home'], { queryParams: { search : true,nameOrId: term, page: 1 } });
      },
      error: () => {
        this.displayedPokemons.set([]);
        this.noResults.set(true);
        this.isLoading.set(false);
      },
    });
  }

  onReset(): void {
    this.router.navigate(['/home'], { queryParams: { page: 1 } });
    this.filters.set(null);

    const all = this.allPokemons();
    this.noResults.set(all.length === 0);
    this.displayedPokemons.set(all);
  } */
}
