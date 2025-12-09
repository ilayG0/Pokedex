import { Injectable, signal } from '@angular/core';
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

  // 🔹 All pokemons
  private _pokemons = signal<Pokemon[]>([]);
  pokemons = this._pokemons.asReadonly();

  // 🔹 Favorite pokemons
  private _favoritePokemons = signal<Pokemon[]>([]);
  favoritePokemons = this._favoritePokemons.asReadonly();

  constructor(private http: HttpClient) {}

  // Optional: original list endpoint (by name+url only)
  getPokemonList(page: number = 1, limit: number = this.pageSize): Observable<PokemonListResponse> {
    const offset = (page - 1) * limit;
    const url = `${this.baseUrl}/pokemon?offset=${offset}&limit=${limit}`;
    return this.http.get<PokemonListResponse>(url);
  }

  // Get single Pokémon by id or name
  getPokemon(idOrName: number | string): Observable<Pokemon> {
    const url = `${this.baseUrl}/pokemon/${idOrName}`;

    return this.http.get<Pokemon>(url).pipe(
      map((pokemon) => {
        const isFav = this._favoritePokemons().some((p) => p.id === pokemon.id);

        return { ...pokemon, isFavorit: isFav };
      })
    );
  }

  // Helper to extract ID from resource URL
  extractIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return Number(parts[parts.length - 1]);
  }

  /**
   * 🔥 Load 12 more full Pokémon objects and update the pokemons signal
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
   * ⭐ Toggle favorite state for a Pokémon
   * - Updates isFavorit in the main pokemons array
   * - Adds/removes from favoritePokemons
   */
  toggleFavorite(pokemon: Pokemon): void {
    const isAlreadyFavorite = this._favoritePokemons().some((p) => p.id === pokemon.id);

    // 1️⃣ Update main pokemons list (flip isFavorit)
    this._pokemons.update((list) =>
      list.map((p) => (p.id === pokemon.id ? { ...p, isFavorit: !isAlreadyFavorite } : p))
    );

    if (isAlreadyFavorite) {
      // 2️⃣ If it was favorite -> remove from favorites
      this._favoritePokemons.update((list) => list.filter((p) => p.id !== pokemon.id));
    } else {
      // 2️⃣ If not favorite -> add to favorites with isFavorit = true
      // use the updated version from main list if exists
      const updatedPokemon = this._pokemons().find((p) => p.id === pokemon.id) ?? {
        ...pokemon,
        isFavorit: true,
      };

      this._favoritePokemons.update((list) => [...list, { ...updatedPokemon, isFavorit: true }]);
    }
  }
}
