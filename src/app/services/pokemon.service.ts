import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  from,
  map,
  mergeMap,
  of,
  switchMap,
  toArray,
  finalize,
  combineLatest,
  tap,
} from 'rxjs';

import { Pokemon } from '../models/pokemon.model';
import { PokemonFilters } from '../models/pokemon-filters.model';
import { SelectOption } from '../models/pokemon-filter-selected-option.model';
import { PokemonListResponse } from '../models/pokemon-api-list-response.model';
import { environment } from '../../environments/environment.dev';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private readonly pokemons_limit = 12;

  isLoadingPage = signal(false);

  totalPokemonsCount = signal(0);
  readonly totalPages = computed(() => {
    const total = this.totalPokemonsCount();
    return total > 0 ? Math.ceil(total / this.pokemons_limit) : 0;
  });

  private _pokemons = signal<Pokemon[]>([]);
  pokemons = this._pokemons.asReadonly();

  favoriteIds = signal<number[]>(this.loadFavoriteIds());
  favoriteCount = computed(() => this.favoriteIds().length);

  private _favoritePokemons = signal<Pokemon[]>([]);
  favoritePokemons = this._favoritePokemons.asReadonly();

  private _recentSearches = signal<string[]>(this.loadRecentSearchesFromStorage());
  recentSearches = this._recentSearches.asReadonly();

  private _typeOptions = signal<SelectOption[]>([]);
  typeOptions = this._typeOptions.asReadonly();

  private _groupOptions = signal<SelectOption[]>([]);
  groupOptions = this._groupOptions.asReadonly();

  constructor(private http: HttpClient) {
    this.initFavoritePokemonsFromStorage();
  }

  getPokemonById(id: number) {
    return this._pokemons().find((p) => p.id === id);
  }

  private loadFavoriteIds(): number[] {
    try {
      return JSON.parse(localStorage.getItem(environment.FAVORITE_POKEMON_IDS) || '[]');
    } catch {
      return [];
    }
  }

  private saveFavoriteIds(): void {
    try {
      localStorage.setItem(environment.FAVORITE_POKEMON_IDS, JSON.stringify(this.favoriteIds()));
    } catch {}
  }

  isFavorite(id: number): boolean {
    return this.favoriteIds().includes(id);
  }

  toggleFavorite(pokemon: Pokemon): void {
    const id = pokemon.id;
    const exists = this.favoriteIds().includes(id);

    const updatedIds = exists
      ? this.favoriteIds().filter((x) => x !== id)
      : [...this.favoriteIds(), id];

    this.favoriteIds.set(updatedIds);
    this.saveFavoriteIds();

    this._pokemons.update((list) =>
      list.map((p) => (p.id === id ? { ...p, isFavorit: !exists } : p))
    );

    if (exists) {
      this._favoritePokemons.update((list) => list.filter((p) => p.id !== id));
    } else {
      this._favoritePokemons.update((list) => {
        const idx = list.findIndex((p) => p.id === id);
        if (idx >= 0) return list;
        return [...list, { ...pokemon, isFavorit: true }].sort((a, b) => a.id - b.id);
      });
    }
  }

  private initFavoritePokemonsFromStorage(): void {
    const ids = this.favoriteIds();
    if (!ids.length) {
      this._favoritePokemons.set([]);
      return;
    }
    this._favoritePokemons.set([]);
    ids.forEach((id) => {
      this.getPokemonByNameOrId(id, { addToList: false, addToFavorites: true }).subscribe();
    });
  }

  private fetchPokemonsPage(page: number): Observable<Pokemon[]> {
    const dynamicOffset = (page - 1) * this.pokemons_limit;
    const url = `${environment.POKEDEX_API_URL}/pokemon?limit=${this.pokemons_limit}&offset=${dynamicOffset}`;

    return this.http.get<PokemonListResponse>(url).pipe(
      tap((res) => {
        if (this.totalPokemonsCount() === 0 && typeof res.count === 'number') {
          this.totalPokemonsCount.set(res.count);
        }
      }),
      map((res) => res.results ?? []),
      mergeMap((results) =>
        from(results).pipe(
          mergeMap((r) => this.http.get<Pokemon>(r.url), 10),
          toArray()
        )
      ),
      map((arr) => arr.slice().sort((a, b) => a.id - b.id)),
      map((sorted) => {
        const favSet = new Set(this.favoriteIds());
        const newPokemons = sorted.map((p) => ({
          ...p,
          isFavorit: favSet.has(p.id),
        }));
        this._pokemons.set(newPokemons);
        return newPokemons;
      })
    );
  }

  load12Pokemons(page: number): void {
    if (this.isLoadingPage()) return;
    this.isLoadingPage.set(true);

    this.fetchPokemonsPage(page)
      .pipe(finalize(() => this.isLoadingPage.set(false)))
      .subscribe({
        error: () => {},
      });
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

  getPokemonByNameOrId(
    idOrName: number | string,
    options?: { addToList?: boolean; addToFavorites?: boolean }
  ): Observable<Pokemon> {
    const addToList = options?.addToList ?? true;
    const addToFavorites = options?.addToFavorites ?? false;

    const url = `${environment.POKEDEX_API_URL}/pokemon/${idOrName}`;

    return this.http.get<any>(url).pipe(
      switchMap((pokemonRes) =>
        this.http.get<any>(`${environment.POKEDEX_API_URL}/pokemon-species/${pokemonRes.id}`).pipe(
          map((speciesRes) => {
            const flavorEntry = speciesRes.flavor_text_entries.find(
              (e: any) => e.language.name === 'en'
            );

            const description: string = flavorEntry
              ? flavorEntry.flavor_text
                  .replace(/\f/g, ' ')
                  .replace(/\n/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
              : '';

            const isFav = this.isFavorite(pokemonRes.id);

            const pokemon: Pokemon = {
              ...pokemonRes,
              description,
              isFavorit: isFav,
            };

            if (addToList) {
              this._pokemons.update((prev) => {
                const idx = prev.findIndex((p) => p.id === pokemon.id);
                if (idx >= 0) {
                  const next = prev.slice();
                  next[idx] = pokemon;
                  return next.sort((a, b) => a.id - b.id);
                }
                return [...prev, pokemon].sort((a, b) => a.id - b.id);
              });
            }

            if (addToFavorites && isFav) {
              this._favoritePokemons.update((prev) => {
                const idx = prev.findIndex((p) => p.id === pokemon.id);
                if (idx >= 0) {
                  const next = prev.slice();
                  next[idx] = pokemon;
                  return next.sort((a, b) => a.id - b.id);
                }
                return [...prev, pokemon].sort((a, b) => a.id - b.id);
              });
            }

            return pokemon;
          })
        )
      )
    );
  }

  private extractIdFromSpeciesUrl(url: string): number | null {
    const match = url.match(/\/(\d+)\/?$/);
    return match ? Number(match[1]) : null;
  }

  private getPokemonIdsByEggGroup(group: string): Observable<Set<number>> {
    const url = `${environment.POKEDEX_API_URL}/egg-group/${group}`;
    return this.http.get<any>(url).pipe(
      map((res) => {
        const ids = new Set<number>();
        for (const s of res.pokemon_species ?? []) {
          const id = this.extractIdFromSpeciesUrl(s.url);
          if (id != null) {
            ids.add(id);
          }
        }
        return ids;
      })
    );
  }

  private getPokemonIdsByColor(color: string): Observable<Set<number>> {
    const url = `${environment.POKEDEX_API_URL}/pokemon-color/${color}`;
    return this.http.get<any>(url).pipe(
      map((res) => {
        const ids = new Set<number>();
        for (const s of res.pokemon_species ?? []) {
          const id = this.extractIdFromSpeciesUrl(s.url);
          if (id != null) {
            ids.add(id);
          }
        }
        return ids;
      })
    );
  }

  searchPokemonsByFilters(
    filters: PokemonFilters | null | undefined,
    page?: number
  ): Observable<Pokemon[]> {
    if (!filters) {
      return of(this._pokemons());
    }

    const height =
      typeof filters.height === 'number' && !Number.isNaN(filters.height) ? filters.height : null;

    const type =
      filters.type && filters.type.trim() !== '' ? filters.type.trim().toLowerCase() : null;

    const group =
      filters.group && filters.group.trim() !== '' ? filters.group.trim().toLowerCase() : null;

    const color =
      filters.color && filters.color.trim() !== '' ? filters.color.trim().toLowerCase() : null;

    const groupIds$ = group ? this.getPokemonIdsByEggGroup(group) : of<Set<number> | null>(null);
    const colorIds$ = color ? this.getPokemonIdsByColor(color) : of<Set<number> | null>(null);

    const basePokemons$ =
      this._pokemons().length === 0 && page != null
        ? this.fetchPokemonsPage(page)
        : of(this._pokemons());

    return combineLatest([groupIds$, colorIds$, basePokemons$]).pipe(
      map(([groupIds, colorIds, pokemons]) => {
        return pokemons.filter((p) => {
          if (height !== null && p.height !== height) {
            return false;
          }

          if (type) {
            const hasType =
              Array.isArray(p.types) &&
              p.types.some((t: any) => t?.type?.name?.toLowerCase() === type);
            if (!hasType) {
              return false;
            }
          }

          if (groupIds && !groupIds.has(p.id)) {
            return false;
          }

          if (colorIds && !colorIds.has(p.id)) {
            return false;
          }

          return true;
        });
      })
    );
  }
}
