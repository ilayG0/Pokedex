import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  forkJoin,
  from,
  map,
  mergeMap,
  shareReplay,
  switchMap,
  tap,
  throwError,
  toArray,
} from 'rxjs';
import { Pokemon } from '../models/pokemon.model';

export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}
export interface SelectOption {
  name: string;
  value: string;
}
export interface PokemonFilters {
  name?: string;
  height?: number;
  type?: string;
  group?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';
  private readonly pageSize = 12;

  // localstorage keu
  private readonly RECENT_SEARCHES_KEY = 'pokemon_recent_searches';

  // All pokemons
  private _pokemons = signal<Pokemon[]>([]);
  pokemons = this._pokemons.asReadonly();

  // Favorite pokemons
  private _favoritePokemons = signal<Pokemon[]>([]);
  favoritePokemons = this._favoritePokemons.asReadonly();

  // Recent searches
  private _recentSearches = signal<string[]>(this.loadRecentSearchesFromStorage());
  recentSearches = this._recentSearches.asReadonly();

  // options for filters (loaded once)
  private _typeOptions = signal<SelectOption[]>([]);
  typeOptions = this._typeOptions.asReadonly();

  private _groupOptions = signal<SelectOption[]>([]);
  groupOptions = this._groupOptions.asReadonly();

  // cache for "all pokemons", fetched only once
  private allPokemons$?: Observable<Pokemon[]>;

  constructor(private http: HttpClient) {}

  // ------------------------------------------------
  //  Fetch ALL pokemons from PokéAPI ONCE and cache
  // ------------------------------------------------
  private fetchAllPokemonsFromApi(): Observable<Pokemon[]> {
    const url = `${this.baseUrl}/pokemon?limit=2000&offset=0`;

    return this.http.get<PokemonListResponse>(url).pipe(
      // first step: get all basic resources (name + url)
      map((res) => res.results),

      // second step: fetch details for EACH pokemon with limited concurrency
      mergeMap((results) =>
        from(results).pipe(
          // concurrency 10 -> 10 parallel HTTP requests at a time
          mergeMap((r) => this.http.get<Pokemon>(r.url), 10),
          toArray()
        )
      ),

      // optional: sort by id, just to keep it tidy
      map((allPokemons) => allPokemons.slice().sort((a, b) => a.id - b.id)),

      // cache in memory so we never do this again in this session
      shareReplay(1)
    );
  }

  private getAllPokemons(): Observable<Pokemon[]> {
    if (!this.allPokemons$) {
      this.allPokemons$ = this.fetchAllPokemonsFromApi();
    }
    return this.allPokemons$;
  }

  // ------------------------------------------------
  //  Search over ALL pokemons using filters
  // ------------------------------------------------
  searchPokemonsByFilters(filters: PokemonFilters): Observable<Pokemon[]> {
    const { name, height, type, group } = filters;

    const normalizedName = name?.trim().toLowerCase() || '';
    const normalizedType = type?.trim().toLowerCase() || '';
    const normalizedGroup = group?.trim().toLowerCase() || '';

    return this.getAllPokemons().pipe(
      map((allPokemons) => {
        // favorite lookup is O(1) by Set
        const favoriteIds = new Set(this._favoritePokemons().map((p) => p.id));

        return (
          allPokemons
            // attach isFavorit based on favorites array
            .map((p) => ({
              ...p,
              isFavorit: favoriteIds.has(p.id),
            }))
            // apply filters
            .filter((p) => {
              // name contains
              console.log(normalizedGroup, normalizedGroup,    normalizedType, height)
              if (normalizedName && p.name.toLowerCase() !== normalizedName) {
                return false;
              }

              // exact height
              if (height != null && height !== undefined) {
                if (p.height == null || p.height !== height) {
                  return false;
                }
              }

              // type filter (supports PokeAPI structure: [{ type: { name } }])
              if (normalizedType) {
                const hasType = p.types?.some((t: any) => {
                  const typeName: string =
                    (t?.type?.name as string) ||
                    (t?.name as string) ||
                    (typeof t === 'string' ? t : '');
                  return typeName.toLowerCase() === normalizedType;
                });

                if (!hasType) {
                  return false;
                }
              }

              // group (egg-group or any custom "group" you add)
              if (normalizedGroup) {
                const pokemonGroup =
                  ((p as any).group as string | string[] | undefined) ?? undefined;

                let hasGroup = false;

                if (typeof pokemonGroup === 'string') {
                  hasGroup = pokemonGroup.toLowerCase() === normalizedGroup;
                } else if (Array.isArray(pokemonGroup)) {
                  hasGroup = pokemonGroup.some((g) => g.toLowerCase() === normalizedGroup);
                }

                if (!hasGroup) {
                  return false;
                }
              }

              return true;
            })
        );
      })
    );
  }

  // =========================================================
  //  Load type & group options once
  // =========================================================
  loadTypesAndGroups(): void {
    // types
    if (this._typeOptions().length === 0) {
      this.http.get<any>(`${this.baseUrl}/type`).subscribe({
        next: (res) => {
          const options =
            (res.results || [])
              .filter((t: any) => !['shadow', 'unknown'].includes(t.name))
              .map((t: any) => ({
                name: t.name,
                value: t.name,
              })) ?? [];
          this._typeOptions.set(options);
        },
        error: () => {
          this._typeOptions.set([]);
        },
      });
    }

    // egg groups
    if (this._groupOptions().length === 0) {
      this.http.get<any>(`${this.baseUrl}/egg-group`).subscribe({
        next: (res) => {
          const options =
            (res.results || []).map((g: any) => ({
              name: g.name,
              value: g.name,
            })) ?? [];
          this._groupOptions.set(options);
        },
        error: () => {
          this._groupOptions.set([]);
        },
      });
    }
  }

  // =========================================================
  // search by a name
  // =========================================================
  searchPokemonByName(name: string): Observable<Pokemon> {
    const term = name.trim().toLowerCase();
    if (!term) {
      return throwError(() => new Error('Empty search term'));
    }

    const url = `${this.baseUrl}/pokemon/${term}`;

    return this.http.get<Pokemon>(url).pipe(
      map((pokemon) => {
        const isFav = this._favoritePokemons().some((p) => p.id === pokemon.id);
        const withFlag: Pokemon = { ...pokemon, isFavorit: isFav };

        // אחרי חיפוש מוצלח – נעדכן היסטוריה
        this.addRecentSearch(term);

        return withFlag;
      })
    );
  }

  // =========================================================
  //  recent searches
  // =========================================================

  private loadRecentSearchesFromStorage(): string[] {
    try {
      const raw = localStorage.getItem(this.RECENT_SEARCHES_KEY);
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
      localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(list.slice(0, 5)));
    } catch {
    
    }
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

  // Optional: original list endpoint (by name+url only)
  getPokemonList(page: number = 1, limit: number = this.pageSize): Observable<PokemonListResponse> {
    const offset = (page - 1) * limit;
    const url = `${this.baseUrl}/pokemon?offset=${offset}&limit=${limit}`;
    return this.http.get<PokemonListResponse>(url);
  }

  // Get single Pokémon by id or name

  getPokemon(idOrName: number | string): Observable<Pokemon> {
    const url = `${this.baseUrl}/pokemon/${idOrName}`;

    return this.http.get<any>(url).pipe(
      switchMap((pokemonRes) =>
        this.http.get<any>(`${this.baseUrl}/pokemon-species/${pokemonRes.id}`).pipe(
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

            const isFav = this._favoritePokemons().some((p) => p.id === pokemonRes.id);

            const pokemon: Pokemon = {
              ...pokemonRes,
              description,
              isFavorit: isFav,
            };

            return pokemon;
          })
        )
      )
    );
  }

  // Helper to extract ID from resource URL
  extractIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return Number(parts[parts.length - 1]);
  }

  /**
   *  Load 12 more full Pokémon objects and update the pokemons signal
   * - Uses current length as offset
   * - Does NOT re-fetch existing ones
   * - Returns the *full* updated array (from the signal)
   */
  loadMorePokemons(): Observable<Pokemon[]> {
    const offset = this._pokemons().length;
    const url = `${this.baseUrl}/pokemon?offset=${offset}&limit=${this.pageSize}`;

    return this.http.get<PokemonListResponse>(url).pipe(
      // first get the list of 12 basic resources
      switchMap((res) => {
        if (res.results.length === 0) {
          // no more Pokémon – just return current signal value
          return forkJoin([] as Observable<Pokemon>[]).pipe(map(() => this._pokemons()));
        }

        // now load full details for each one
        const detailRequests = res.results.map((r) => this.http.get<Pokemon>(r.url));

        return forkJoin(detailRequests);
      }),

      tap((newPokemons: Pokemon[]) => {
        // keep isFavorit = true for pokemons already in favorites
        const favoriteIds = new Set(this._favoritePokemons().map((p) => p.id));

        const merged = newPokemons.map((p) =>
          favoriteIds.has(p.id) ? { ...p, isFavorit: true } : p
        );

        this._pokemons.update((prev) => [...prev, ...merged]);
      }),

      // return the full current list from the signal
      map(() => this._pokemons())
    );
  }

  /**
   *  Toggle favorite state for a Pokémon
   * - Updates isFavorit in the main pokemons array
   * - Adds/removes from favoritePokemons
   */
  toggleFavorite(pokemon: Pokemon): void {
    const isAlreadyFavorite = this._favoritePokemons().some((p) => p.id === pokemon.id);

    //  Update main pokemons list (flip isFavorit)
    this._pokemons.update((list) =>
      list.map((p) => (p.id === pokemon.id ? { ...p, isFavorit: !isAlreadyFavorite } : p))
    );

    if (isAlreadyFavorite) {
      //  If it was favorite -> remove from favorites
      this._favoritePokemons.update((list) => list.filter((p) => p.id !== pokemon.id));
    } else {
      // If not favorite -> add to favorites with isFavorit = true
      // use the updated version from main list if exists
      const updatedPokemon = this._pokemons().find((p) => p.id === pokemon.id) ?? {
        ...pokemon,
        isFavorit: true,
      };

      this._favoritePokemons.update((list) => [...list, { ...updatedPokemon, isFavorit: true }]);
    }
  }
}
