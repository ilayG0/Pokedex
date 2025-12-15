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

  private readonly results = signal<Pokemon[]>([]);
  displayedPokemons = computed(() => this.results());

  private readonly mode = signal<'home' | 'search' | 'filters'>('home');
  private readonly lastFilters = signal<PokemonFilters | null>(null);

  isEmptyFiltersResult = signal(false);
  notify = signal<string | null>(null);

  canGoNext = computed(() => {
    if (this.isLoading()) return false;
    if (this.mode() === 'filters' || this.mode() === 'search') {
      return !this.isEmptyFiltersResult() && this.displayedPokemons().length === this.pageSize;
    }
    return this.displayedPokemons().length === this.pageSize;
  });

  canGoPrev = computed(() => !this.isLoading() && this.currentPage() > 1);

  ngOnInit(): void {
    this.listenToQueryParams();
  }

  private listenToQueryParams(): void {
    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        switchMap((qp) => {
          this.notify.set(null);
          this.isEmptyFiltersResult.set(false);

          const pageFromUrl = Number(qp['page'] ?? 1);
          const safePage = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
          this.currentPage.set(safePage);

          const nameOrId = (qp['nameOrId'] ?? '').toString().trim();
          if (nameOrId) {
            this.mode.set('search');
            this.lastFilters.set(null);

            this.isLoading.set(true);

            return this.pokemonService.filterPokemonsByNameOrId(nameOrId).pipe(
              tap((list) => {
                this.results.set(list);
                this.isEmptyFiltersResult.set(list.length === 0);
                if (list.length === 0) this.notify.set('No Pokémon found for your search.');
              }),
              finalize(() => this.isLoading.set(false))
            );
          }

          const hasAnyFilter =
            qp['height'] != null ||
            qp['group'] != null ||
            qp['type'] != null ||
            qp['color'] != null;

          if (hasAnyFilter) {
            const filters: PokemonFilters = {
              height: qp['height'] != null ? Number(qp['height']) : undefined,
              group: qp['group'] ?? undefined,
              type: qp['type'] ?? undefined,
              color: qp['color'] ?? undefined,
            };

            this.mode.set('filters');
            this.lastFilters.set(filters);

            this.isLoading.set(true);

            return this.pokemonService.searchPokemonsByFiltersPaged(filters, safePage).pipe(
              tap((pageList) => {
                this.results.set(pageList);
                const empty = pageList.length === 0;
                this.isEmptyFiltersResult.set(empty);
                if (empty) this.notify.set('No results for the selected filters.');
              }),
              finalize(() => this.isLoading.set(false))
            );
          }

          this.mode.set('home');
          this.lastFilters.set(null);

          this.isLoading.set(true);

          return this.pokemonService.loadPage(safePage).pipe(
            tap(() => {
              const allLoaded = this.pokemonService.pokemons();
              const start = (safePage - 1) * this.pageSize;
              this.results.set(allLoaded.slice(start, start + this.pageSize));
              if (this.results().length === 0) this.notify.set('No Pokémon to display.');
            }),
            finalize(() => this.isLoading.set(false))
          );
        })
      )
      .subscribe({
        error: () => {
          this.results.set([]);
          this.isEmptyFiltersResult.set(true);
          this.notify.set('Something went wrong. Please try again.');
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
        nameOrId: null,
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
    if (!this.canGoNext()) {
      if (this.mode() === 'filters' && this.isEmptyFiltersResult()) {
        this.notify.set('No more results for the selected filters.');
      } else if (this.displayedPokemons().length < this.pageSize) {
        this.notify.set('No more results.');
      }
      return;
    }

    const next = this.currentPage() + 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: next },
      queryParamsHandling: 'merge',
    });
  }

  prevPage(): void {
    if (!this.canGoPrev()) return;

    const prev = this.currentPage() - 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: prev },
      queryParamsHandling: 'merge',
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
