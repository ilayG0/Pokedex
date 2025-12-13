import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchBar } from '../../component/search-bar/search-bar.component';
import { PokemonListComponent } from '../../features/pokemon-list/pokemon-list.component';
import { FilterPanelComponent } from '../../component/filter-panel.component/filter-panel.component';

import { Pokemon } from '../../models/pokemon.model';
import { PokemonService } from '../../services/pokemon.service';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, of, Subject, switchMap, takeUntil } from 'rxjs';

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
  private readonly route = inject(ActivatedRoute);

  private readonly destroy$ = new Subject<void>();

  isLoading = signal(false);
  showFilter = signal(false);

  filters = signal<PokemonFilters | null>(null);
  noResults = signal(false);

  allPokemons = signal<Pokemon[]>([]);
  displayedPokemons = signal<Pokemon[]>([]);

  ngOnInit(): void {
    // 1) Load base list once
    this.isLoading.set(true);
    this.pokemonService
      .getAllPokemons()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (pokemons) => {
          this.allPokemons.set(pokemons);

          // if no query params -> show all
          if (Object.keys(this.route.snapshot.queryParams).length === 0) {
            this.displayedPokemons.set(pokemons);
            this.noResults.set(pokemons.length === 0);
          }
        },
        error: () => {
          this.allPokemons.set([]);
          this.displayedPokemons.set([]);
          this.noResults.set(true);
        },
      });

    // 2) React to query params changes (this is the missing piece)
    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        switchMap((qp) => {
          // nothing in URL -> show all
          if (!qp || Object.keys(qp).length === 0) {
            this.filters.set(null);
            this.noResults.set(this.allPokemons().length === 0);
            return of(this.allPokemons());
          }

          // nameOrId search
          if (qp['nameOrId']) {
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
        this.router.navigate(['/search'], {
          queryParams: {
            ...(filters.height != null ? { height: filters.height } : {}),
            ...(filters.group ? { group: filters.group } : {}),
            ...(filters.type ? { type: filters.type } : {}),
            ...(filters.color ? { color: filters.color } : {}),
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
      this.router.navigate(['/']);
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
        this.router.navigate(['/search'], { queryParams: { nameOrId: term } });
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
    this.router.navigate(['/']);
    this.filters.set(null);
    this.noResults.set(this.allPokemons().length === 0);
    this.displayedPokemons.set(this.allPokemons());
  }
}
