import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, switchMap, tap } from 'rxjs';
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

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';
  private readonly pageSize = 12;
  private readonly FAVORITES_KEY = 'favoritePokemonIds';

  private _pokemons: Pokemon[] = [];
  private _favoriteIds = new Set<number>(); // 🔥 only ids, easy to persist

  constructor(private http: HttpClient) {
    this.loadFavoritesFromStorage();
  }

  // ---------- FAVORITES PERSISTENCE ----------

  private loadFavoritesFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.FAVORITES_KEY);
      if (!raw) return;
      const ids: number[] = JSON.parse(raw);
      this._favoriteIds = new Set(ids);
    } catch {
      this._favoriteIds = new Set();
    }
  }

  private saveFavoritesToStorage(): void {
    const ids = Array.from(this._favoriteIds.values());
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(ids));
  }

  // helper: decorate pokemon with isFavorit based on favorite ids
  private withFavoriteFlag(pokemon: Pokemon): Pokemon {
    const isFav = this._favoriteIds.has(pokemon.id);
    return {
      ...pokemon,
      isFavorit: isFav,
    };
  }

  // ---------- PUBLIC GETTERS ----------

  get cachedPokemons(): Pokemon[] {
    return this._pokemons;
  }

  get favoritePokemons(): Pokemon[] {
    // רק מהקאש שהם פייבוריט
    return this._pokemons.filter((p) => this._favoriteIds.has(p.id));
  }

  // ---------- API CALLS ----------

  getPokemonList(
    page: number = 1,
    limit: number = this.pageSize
  ): Observable<PokemonListResponse> {
    const offset = (page - 1) * limit;
    const url = `${this.baseUrl}/pokemon?offset=${offset}&limit=${limit}`;
    return this.http.get<PokemonListResponse>(url);
  }

  // Get single Pokémon by id or name
  getPokemon(idOrName: number | string): Observable<Pokemon> {
    const url = `${this.baseUrl}/pokemon/${idOrName}`;
    return this.http.get<Pokemon>(url).pipe(
      map((dataFromApi) => this.withFavoriteFlag(dataFromApi)), // 👈 adds isFavorit from stored ids
      tap((pokemon) => {
        // keep cache in sync if needed
        const idx = this._pokemons.findIndex((p) => p.id === pokemon.id);
        if (idx !== -1) {
          this._pokemons[idx] = pokemon;
        }
      })
    );
  }

  extractIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return Number(parts[parts.length - 1]);
  }

  /**
   * 🔥 Load 12 more full Pokémon objects and cache them
   */
  loadMorePokemons(): Observable<Pokemon[]> {
    const offset = this._pokemons.length;
    const url = `${this.baseUrl}/pokemon?offset=${offset}&limit=${this.pageSize}`;

    return this.http.get<PokemonListResponse>(url).pipe(
      switchMap((res) => {
        if (res.results.length === 0) {
          return forkJoin([] as Observable<Pokemon>[]).pipe(
            map(() => [] as Pokemon[])
          );
        }

        const detailRequests = res.results.map((r) =>
          this.http.get<Pokemon>(r.url).pipe(
            map((dataFromApi) => this.withFavoriteFlag(dataFromApi)) // 👈 decorate with isFavorit
          )
        );

        return forkJoin(detailRequests);
      }),
      tap((newPokemons: Pokemon[]) => {
        this._pokemons = [...this._pokemons, ...newPokemons];
      }),
      map(() => this._pokemons)
    );
  }

  // ---------- FAVORITES LOGIC ----------

  toggleFavorite(pokemon: Pokemon): void {
    const alreadyFav = this._favoriteIds.has(pokemon.id);

    if (alreadyFav) {
      this._favoriteIds.delete(pokemon.id);
    } else {
      this._favoriteIds.add(pokemon.id);
    }

    // persist to localStorage
    this.saveFavoritesToStorage();

    // update cache objects to reflect new state
    this._pokemons = this._pokemons.map((p) =>
      p.id === pokemon.id ? this.withFavoriteFlag(p) : p
    );
  }
}
