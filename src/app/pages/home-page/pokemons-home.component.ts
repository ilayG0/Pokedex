import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, finalize, switchMap, takeUntil, tap, of } from 'rxjs';

import { SearchBar } from '../../component/search-bar/search-bar.component';
import { PokemonListComponent } from '../../features/pokemon-list/pokemon-list.component';
import { FilterPanelComponent } from '../../component/filter-panel.component/filter-panel.component';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';

import { Pokemon } from '../../models/pokemon.model';
import { PokemonFilters } from '../../models/pokemon-filters.model';
import { PokemonService } from '../../services/pokemon.service';

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

  readonly pageSize = 12;

  isLoading = signal(false);
  showFilter = signal(false);

  currentPage = signal(1);
  noResults = signal(false);

  private readonly results = signal<Pokemon[]>([]);

  displayedPokemons = computed(() => {
    const list = this.results();
    const start = (this.currentPage() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => {
    const len = this.results().length;
    return Math.max(1, Math.ceil(len / this.pageSize));
  });

  private readonly mode = signal<'home' | 'search' | 'filters'>('home');
  private readonly lastSearchTerm = signal<string>('');
  private readonly lastFilters = signal<PokemonFilters | null>(null);

  ngOnInit(): void {
    this.listenToQueryParams();
  }

  private listenToQueryParams(): void {
    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        switchMap((qp) => {
          const pageFromUrl = Number(qp['page'] ?? 1);
          const safePage = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
          this.currentPage.set(safePage);

          const nameOrId = (qp['nameOrId'] ?? '').toString().trim();
          if (nameOrId) {
            this.mode.set('search');
            this.lastSearchTerm.set(nameOrId);
            this.lastFilters.set(null);

            this.isLoading.set(true);
            this.noResults.set(false);

            return this.pokemonService.filterPokemonsByNameOrId(nameOrId).pipe(
              tap((list) => this.results.set(list)),
              tap((list) => this.noResults.set(list.length === 0)),
              finalize(() => this.isLoading.set(false))
            );
          }

          const hasAnyFilter =
            qp['height'] != null || qp['group'] != null || qp['type'] != null || qp['color'] != null;

          if (hasAnyFilter) {
            const filters: PokemonFilters = {
              height: qp['height'] != null ? Number(qp['height']) : undefined,
              group: qp['group'] ?? undefined,
              type: qp['type'] ?? undefined,
              color: qp['color'] ?? undefined,
            };

            this.mode.set('filters');
            this.lastFilters.set(filters);
            this.lastSearchTerm.set('');

            this.isLoading.set(true);
            this.noResults.set(false);

            return this.pokemonService.searchPokemonsByFilters(filters).pipe(
              tap((list) => this.results.set(list)),
              tap((list) => this.noResults.set(list.length === 0)),
              finalize(() => this.isLoading.set(false))
            );
          }

          this.mode.set('home');
          this.lastFilters.set(null);
          this.lastSearchTerm.set('');

          this.isLoading.set(true);
          this.noResults.set(false);

          return this.pokemonService.loadPage(safePage).pipe(
            tap(() => {
              const allLoaded = this.pokemonService.pokemons();
              this.results.set(allLoaded);
              this.noResults.set(allLoaded.length === 0);
            }),
            finalize(() => this.isLoading.set(false))
          );
        })
      )
      .subscribe({
        error: () => {
          this.results.set([]);
          this.noResults.set(true);
          this.isLoading.set(false);
        },
      });
  }

  onToggleFiltersForm(): void {
    this.showFilter.update((v) => !v);
  }

  onFiltersCancel(): void {
    this.showFilter.set(false);
  }

  onFilterSubmit(filters: PokemonFilters): void {
    this.showFilter.set(false);
    this.router.navigate(['/home'], {
      queryParams: {
        page: 1,
        ...(filters.height != null ? { height: filters.height } : {}),
        ...(filters.group ? { group: filters.group } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.color ? { color: filters.color } : {}),
      },
      queryParamsHandling: 'merge',
    });
  }

  onFoundPokemon(searchString: string): void {
    const term = searchString.trim();
    if (!term) {
      this.onReset();
      return;
    }

    this.router.navigate(['/home'], {
      queryParams: { nameOrId: term, page: 1, height: null, group: null, type: null, color: null },
      queryParamsHandling: 'merge',
    });
  }

  onReset(): void {
    this.showFilter.set(false);
    this.router.navigate(['/home'], {
      queryParams: { page: 1, nameOrId: null, height: null, group: null, type: null, color: null },
      queryParamsHandling: 'merge',
    });
  }

  nextPage(): void {
    const next = this.currentPage() + 1;

    if (this.mode() === 'search' || this.mode() === 'filters') {
      if (next > this.totalPages()) return;
      this.router.navigate([], { relativeTo: this.route, queryParams: { page: next }, queryParamsHandling: 'merge' });
      return;
    }

    this.isLoading.set(true);
    this.pokemonService
      .loadPage(next)
      .pipe(finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate([], { relativeTo: this.route, queryParams: { page: next }, queryParamsHandling: 'merge' });
        },
        error: () => {
          this.noResults.set(true);
        },
      });
  }

  prevPage(): void {
    const prev = this.currentPage() - 1;
    if (prev < 1) return;

    this.router.navigate([], { relativeTo: this.route, queryParams: { page: prev }, queryParamsHandling: 'merge' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
