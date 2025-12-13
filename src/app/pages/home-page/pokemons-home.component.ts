import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchBar } from '../../component/search-bar/search-bar.component';
import { PokemonListComponent } from '../../features/pokemon-list/pokemon-list.component';
import { FilterPanelComponent } from '../../component/filter-panel.component/filter-panel.component';

import { Pokemon } from '../../models/pokemon.model';
import { PokemonService } from '../../services/pokemon.service';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { ActivatedRoute, Router } from '@angular/router';

import { finalize, of, Subject, switchMap, takeUntil, tap } from 'rxjs';

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
export class PokemonsHome implements OnInit, OnDestroy {
  private readonly pokemonService = inject(PokemonService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly destroy$ = new Subject<void>();

  isLoading = signal(false);
  showFilter = signal(false);

  filters = signal<PokemonFilters | null>(null);
  noResults = signal(false);

  allPokemons = signal<Pokemon[]>([]);
  displayedPokemons = signal<Pokemon[]>([]);

  ngOnInit(): void {
    // Ensure /search always has page=1 (only when missing)
    const initialQp = this.route.snapshot.queryParams;
    if (this.route.snapshot.routeConfig?.path === 'search' && !('page' in initialQp)) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: 1 },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }

    // Load base list ONCE, then start URL-reactive logic
    this.isLoading.set(true);

    this.pokemonService
      .getAllPokemons()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false)),
        tap((pokemons) => this.allPokemons.set(pokemons))
      )
      .subscribe({
        next: () => this.listenToQueryParams(),
        error: () => {
          this.allPokemons.set([]);
          this.displayedPokemons.set([]);
          this.noResults.set(true);
        },
      });
  }

  private listenToQueryParams(): void {
    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        switchMap((qp) => {
          const keys = Object.keys(qp ?? {});
          const onlyPage = keys.length === 1 && keys[0] === 'page';

          // No query params OR only paging -> show base list
          if (!qp || keys.length === 0 || onlyPage) {
            this.filters.set(null);
            const all = this.allPokemons();
            this.noResults.set(all.length === 0);
            return of(all);
          }

          // nameOrId search
          if (qp['nameOrId']) {
            this.filters.set(null);
            this.noResults.set(false);
            this.isLoading.set(true);

            return this.pokemonService
              .filterPokemonsByNameOrId(qp['nameOrId'])
              .pipe(finalize(() => this.isLoading.set(false)));
          }

          // filters search
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

        // Always reset paging on a NEW filter search
        this.router.navigate(['/search'], {
          queryParams: {
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
      // Reset to home page 1
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

        // Always reset paging on a NEW search
        this.router.navigate(['/search'], { queryParams: { nameOrId: term, page: 1 } });
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
  }
}
