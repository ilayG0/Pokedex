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

  isLoading = this.pokemonService.isLoadingPage;
  showFilter = signal(false);
  navigationError = signal(false);
  filters = signal<PokemonFilters | null>(null);
  noResults = signal(false);
  currentPage = signal(1);

  private readonly searchResult = signal<Pokemon[] | null>(null);

  readonly displayedPokemons = computed(
    () => this.searchResult() ?? this.pokemonService.pokemons()
  );
  readonly displayedLoadPokemonsBtn = computed(
    () => !this.searchResult() || this.searchResult()!.length === 0
  );

ngOnInit(): void {
  this.route.queryParams.subscribe((params) => {
    const rawPage = params['page'];
    const page = rawPage ? Number(rawPage) : 1;
    this.currentPage.set(page);

    const search = params['search'] === 'true';
    const hasFilters = params['filters'] === 'true';
    const nameOrId = params['nameOrId'];

    if (search) {
      if (nameOrId) {
        this.onSearchPokemonByNameOrId(nameOrId);
        return; 
      }
      if (hasFilters) {
        const color = params['color'] ?? null;
        const group = params['group'] ?? null;
        const type = params['type'] ?? null;

        const heightParam = params['height'];
        const height =
          heightParam !== undefined && heightParam !== null && heightParam !== ''
            ? Number(heightParam)
            : undefined;

        const filters: PokemonFilters = {
          height: height,
          type: type,
          group: group,
          color: color,
        };
      this.onSearchFilterSubmit(filters);
        return; 
      }

      this.searchResult.set(null);
      this.noResults.set(false);
    }

    if (!Number.isFinite(page) || page < 1) {
      this.navigationError.set(true);
      return;
    }

    this.searchResult.set(null);
    this.noResults.set(false);
    this.pokemonService.load12Pokemons(page);
  });
}


  onSearchPokemonByNameOrId(nameOrId: string): void {
    const q = nameOrId.trim();

    if (!q) {
      this.searchResult.set(null);
      this.noResults.set(false);
      return;
    }

    this.isLoading.set(true);
    this.noResults.set(false);

    this.pokemonService
      .getPokemonByNameOrId(q)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { search: true, nameOrId: q },
            replaceUrl: true,
          });
        })
      )
      .subscribe({
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
  onToggleFiltersForm(): void {
    this.showFilter.update((v) => !v);
  }
  onFiltersCancel(): void {
    this.showFilter.set(false);
  }
  onSearchFilterSubmit(formValue: PokemonFilters): void {
    this.isLoading.set(true);
    this.filters.set(formValue);
    this.noResults.set(false);

    this.pokemonService.searchPokemonsByFilters(formValue, this.currentPage()).subscribe({
      next: (result) => {
        const filters = this.filters();

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            page: this.currentPage(),
            ...(filters?.color && filters.color.trim() !== '' ? { color: filters.color } : {}),
            ...(filters?.type && filters.type.trim() !== '' ? { type: filters.type } : {}),
            ...(filters?.group && filters.group.trim() !== '' ? { group: filters.group } : {}),
            ...(typeof filters?.height === 'number' && !Number.isNaN(filters.height)
              ? { height: filters.height }
              : {}),
            search: true,
            filters: true,
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
        this.isLoading.set(false);
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
