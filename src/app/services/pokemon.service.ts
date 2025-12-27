import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, of, finalize, tap, switchMap, shareReplay } from 'rxjs';

import { Pokemon } from '../models/pokemon.model';
import { PokemonFilters } from '../models/pokemon-filters.model';
import { SelectOption } from '../models/pokemon-filter-selected-option.model';
import { environment } from '../../environments/environment.dev';
import { PokemonPageResponse } from '../models/pokemon-api-list-response.model';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private pokemonsURL = environment.SERVER_URL + '/pokemons';
  private favoritesURL = environment.SERVER_URL + '/favorite';

  isLoadingPage = signal(false);

  totalPages = signal(0);

  private readonly _favorites = signal<Pokemon[]>([]);
  private readonly _isFavoritesLoading = signal(false);

  readonly favorites = this._favorites.asReadonly();
  readonly isFavoritesLoading = this._isFavoritesLoading.asReadonly();
  readonly favoriteCount = computed(() => this._favorites().length);

  private _recentSearches = signal<string[]>(this.loadRecentSearchesFromStorage());
  recentSearches = this._recentSearches.asReadonly();

  private _typeOptions = signal<SelectOption[]>([]);
  typeOptions = this._typeOptions.asReadonly();

  private _groupOptions = signal<SelectOption[]>([]);
  groupOptions = this._groupOptions.asReadonly();

  private favoritesInit$?: Observable<Pokemon[]>;

  constructor(private http: HttpClient) {}

  private createAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
    });
  }

  private initFavorites(): Observable<Pokemon[]> {
    if (this._favorites().length > 0) {
      return of(this._favorites());
    }

    if (this.favoritesInit$) {
      return this.favoritesInit$;
    }

    const headers = this.createAuthHeaders();

    this._isFavoritesLoading.set(true);

    this.favoritesInit$ = this.http
      .get<{ favorites: Pokemon[] }>(`${this.favoritesURL}/me`, { headers })
      .pipe(
        map((res) => res.favorites ?? []),
        tap((list) => this._favorites.set(list)),
        finalize(() => {
          this._isFavoritesLoading.set(false);
          this.favoritesInit$ = undefined;
        }),
        shareReplay(1)
      );

    return this.favoritesInit$;
  }

  getPokemons(page: number, limit: number) {
    const headers = this.createAuthHeaders();
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));

    return this.http.get<PokemonPageResponse>(this.pokemonsURL, { headers, params }).pipe(
      tap((res) => {
        this.totalPages.set(res.totalPages);
      }),
      map((res) => res.data ?? [])
    );
  }

  getPokemonByNameOrId(idOrName: number | string): Observable<Pokemon> {
    const headers = this.createAuthHeaders();
    return this.http.get<Pokemon>(`${this.pokemonsURL}/${idOrName}`, { headers });
  }

  isFavorite(pokedexId: number): Observable<boolean> {
    return this.initFavorites().pipe(
      map((favorites) => favorites.some((p) => p.pokedexId === pokedexId))
    );
  }

  getFavoritesCount(): Observable<number> {
    return this.initFavorites().pipe(map(() => this.favoriteCount()));
  }

  getFavorites(): Observable<Pokemon[]> {
    return this.initFavorites();
  }

  loadFavorites(): void {
    this.initFavorites().subscribe({
      error: (err) => {
        console.error('Failed to load favorites', err);
        this._favorites.set([]);
      },
    });
  }

  toggleFavorite(pokedexId: number, isLiked: boolean): Observable<boolean> {
    const headers = this.createAuthHeaders();

    return this.initFavorites().pipe(
      switchMap(() => {
        if (isLiked) {
          return this.http.delete(`${this.favoritesURL}/${pokedexId}`, { headers }).pipe(
            tap(() => {
              this._favorites.update((current) =>
                current.filter((pokemon) => pokemon.pokedexId !== pokedexId)
              );
            }),
            map(() => false)
          );
        }

        return this.http.post(this.favoritesURL, { pokedexId }, { headers }).pipe(
          switchMap(() => this.getPokemonByNameOrId(pokedexId)),
          tap((pokemon) => {
            const exists = this._favorites().some((p) => p.pokedexId === pokedexId);
            if (!exists) {
              this._favorites.update((current) => [...current, pokemon]);
            }
          }),
          map(() => true)
        );
      })
    );
  }

  loadTypesAndGroups(): void {
    if (this._typeOptions().length === 0) {
      this.http.get<any>(`${environment.POKEDEX_API_URL}/type`).subscribe({
        next: (res) => {
          const options =
            (res.results || [])
              .filter((t: any) => !['shadow', 'unknown'].includes(t.name))
              .map((t: any) => ({ name: t.name, value: t.name })) ?? [];
          this._typeOptions.set(options);
        },
        error: () => this._typeOptions.set([]),
      });
    }

    if (this._groupOptions().length === 0) {
      this.http.get<any>(`${environment.POKEDEX_API_URL}/egg-group`).subscribe({
        next: (res) => {
          const options =
            (res.results || []).map((g: any) => ({ name: g.name, value: g.name })) ?? [];
          this._groupOptions.set(options);
        },
        error: () => this._groupOptions.set([]),
      });
    }
  }

  private loadRecentSearchesFromStorage(): string[] {
    try {
      const raw = localStorage.getItem(environment.RECENT_SEARCHES_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.slice(0, 5);
    } catch {
      return [];
    }
  }

  private saveRecentSearchesToStorage(list: string[]): void {
    try {
      localStorage.setItem(environment.RECENT_SEARCHES_KEY, JSON.stringify(list.slice(0, 5)));
    } catch {}
  }

  addRecentSearch(term: string): void {
    const clean = term.trim().toLowerCase();
    if (!clean) return;

    this._recentSearches.update((prev) => {
      const withoutDup = prev.filter((t) => t !== clean);
      const next = [clean, ...withoutDup].slice(0, 5);
      this.saveRecentSearchesToStorage(next);
      return next;
    });
  }

  clearRecentSearches(): void {
    this._recentSearches.set([]);
    this.saveRecentSearchesToStorage([]);
  }

  removeRecentSearch(term: string): void {
    const clean = term.trim().toLowerCase();
    this._recentSearches.update((prev) => {
      const next = prev.filter((t) => t !== clean);
      this.saveRecentSearchesToStorage(next);
      return next;
    });
  }

  searchPokemonsByFilters(
    filters: PokemonFilters,
    page: number,
    limit: number
  ): Observable<Pokemon[]> {
    const headers = this.createAuthHeaders();

    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));

    if (filters.height !== undefined && filters.height !== null) {
      params = params.set('height', String(filters.height));
    }

    if (filters.type) {
      params = params.set('type', filters.type);
    }

    if (filters.group) {
      params = params.set('group', filters.group);
    }

    if (filters.color) {
      params = params.set('color', filters.color);
    }

    return this.http
      .get<PokemonPageResponse>(`${this.pokemonsURL}/search`, {
        headers,
        params,
      })
      .pipe(
      tap((res) => {
        this.totalPages.set(res.totalPages ?? 0);
      }),
      map((res) => res.data ?? [])
    );
  }
}
