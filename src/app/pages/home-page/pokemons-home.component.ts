import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { SearchBar } from '../../component/search-bar/search-bar.component';
import { PokemonListComponent } from '../../features/pokemon-list/pokemon-list.component';
import { FilterPanelComponent } from '../../component/filter-panel.component/filter-panel.component';
import { PokemonFilters } from '../../models/pokemon-filters.model';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonService } from '../../services/pokemon.service';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
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
  private readonly limit = 12;

  private readonly pokemonService = inject(PokemonService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly _pokemons = signal<Pokemon[]>([]);
  private readonly _searchResult = signal<Pokemon[] | null>(null);

  readonly loading = signal(false);
  readonly showFilter = signal(false);
  readonly navigationError = signal(false);
  readonly noResults = signal(false);
  readonly currentPage = signal(1);
  readonly filters = signal<PokemonFilters | null>(null);

  get pokemons(): Pokemon[] {
    return this._pokemons();
  }

  get searchResult(): Pokemon[] | null {
    return this._searchResult();
  }

  readonly displayedLoadPokemonsBtn = computed(
    () => !this._searchResult() || this._searchResult()!.length === 0
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

          const filterValue: PokemonFilters = {
            height,
            type,
            group,
            color,
          };

          this.filters.set(filterValue);
          return;
        }

        this._searchResult.set(null);
        this.noResults.set(false);
      }

      if (!Number.isFinite(page) || page < 1) {
        this.navigationError.set(true);
        return;
      }

      this._searchResult.set(null);
      this.noResults.set(false);
      this.loadPage(page);
    });
  }

  loadPage(page: number): void {
    this.loading.set(true);

    this.pokemonService
      .getPokemons(page, this.limit)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (list) => {
          console.log(list)
          this._pokemons.set(list);
        },
        error: (err) => {
          console.error('Error loading pokemons', err);
        },
      });
  }

  onToggleFiltersForm(): void {
    this.showFilter.update((v) => !v);
  }

  onFiltersCancel(): void {
    this.showFilter.set(false);
  }

  onResetFilters(): void {
    this.filters.set(null);
    this._searchResult.set(null);
    this.noResults.set(false);
  }
}
