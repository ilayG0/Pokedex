import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchBar } from '../../component/search-bar/search-bar.component';
import { PokemonListComponent } from '../../features/pokemon-list/pokemon-list.component';
import { FilterPanelComponent } from '../../component/filter-panel.component/filter-panel.component';
import { PokemonFilters } from '../../models/pokemon-filters.model';

import { Pokemon } from '../../models/pokemon.model';
import { PokemonService } from '../../services/pokemon.service';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { ActivatedRoute, Router } from '@angular/router';

import { finalize } from 'rxjs';
import { PokemonErrorNotificationComponent } from '../../shared/pokemon-error-notification.component/pokemon-error-notification.component';

@Component({
  selector: 'app-pokemons-home',
  standalone: true,
  imports: [
    CommonModule,
    SearchBar,
    PokemonListComponent,
    FilterPanelComponent,
    LoadingPokeBall,
    PokemonErrorNotificationComponent,
  ],
  templateUrl: './pokemons-home.component.html',
  styleUrls: ['./pokemons-home.component.scss'],
})
export class PokemonsHome implements OnInit {
  readonly pokemonService = inject(PokemonService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isLoading = this.pokemonService.isLoadingPage();
  showFilter = signal(false);
  navigationError = signal(false);
  filters = signal<PokemonFilters | null>(null);
  noResults = signal(false);

  private readonly searchResult = signal<Pokemon[] | null>(null);
  private initialQueryHandled = false;

  readonly displayedPokemons = computed(
    () => this.searchResult() ?? this.pokemonService.pokemons()
  );
  readonly displayedLoadPokemonsBtn = computed(
    () => !this.searchResult() || this.searchResult()!.length === 0
  );

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const raw = params['page'];
      const search = params['search'];
      const page = raw ? Number(raw) : 1;
      console.log(raw)
      if (search && !this.initialQueryHandled) {
        this.router.navigate(['home'], { queryParams: { page: 1 } });
      }

      if (!Number.isFinite(page) || page < 1) {
        this.navigationError.set(true);
        return;
      }

      this.navigationError.set(false);

      if (!this.initialQueryHandled) {
        this.initialQueryHandled = true;

        if (page > 2) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { page: 1 },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
          return;
        }
      }

      this.pokemonService.ensurePokemonsLoadedUpTo(page);
    });
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
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.noResults.set(false);

    this.pokemonService
      .getPokemonByNameOrId(q)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (p) => {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { page: 1, search: true, nameOrId: q },
            replaceUrl: true,
          });
          this.searchResult.set([p]);
        },
        error: (err) => {
          console.error('Error loading pokemon', err);
          this.searchResult.set([]);
          this.noResults.set(true);
        },
      });
  }

  isValidPage(page: number) {
    if (page === 0 || page === null || page === undefined || isNaN(page)) {
      this.navigationError.set(true);
      return;
    }

    let numberOfPages = Math.ceil(this.displayedPokemons().length / 12);

    if (numberOfPages < page) {
      this.navigationError.set(true);
      return;
    }
    this.navigationError.set(false);
  }
  onToggleFiltersForm(): void {
    this.showFilter.update((v) => !v);
  }
  onFiltersCancel(): void {
    this.showFilter.set(false);
  }
  onSearchFilterSubmit(formValue: PokemonFilters): void {
    this.isLoading = true;
    this.filters.set(formValue);
    this.noResults.set(false);

    this.pokemonService.searchPokemonsByFilters(formValue).subscribe({
      next: (result) => {
        const filters = this.filters();

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            page: 1,
            ...(filters?.color && filters.color.trim() !== '' ? { color: filters.color } : {}),
            ...(filters?.type && filters.type.trim() !== '' ? { type: filters.type } : {}),
            ...(filters?.group && filters.group.trim() !== '' ? { group: filters.group } : {}),
            ...(typeof filters?.height === 'number' && !Number.isNaN(filters.height)
              ? { height: filters.height }
              : {}),
            search: true,
          },
          replaceUrl: true,
        });
        this.searchResult.set(result);
        this.noResults.set(result.length === 0);
      },
      error: () => {
        this.searchResult.set([]);
        this.noResults.set(true);
      },
      complete: () => {
        this.isLoading = false;
        this.onFiltersCancel();
      },
    });
  }

  onResetFilters(): void {
    this.filters.set(null);
    this.searchResult.set(null);
    this.noResults.set(false);
  }
}
