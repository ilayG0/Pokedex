
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

  // ⬇️ cache of fully-loaded Pokémon
  private _pokemons: Pokemon[] = [];

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
    return this.http.get<Pokemon>(url);
  }

  // Helper to extract ID from resource URL
  extractIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return Number(parts[parts.length - 1]);
  }

  // 👉 expose cached Pokémon (read-only)
  get cachedPokemons(): Pokemon[] {
    return this._pokemons;
  }

  /**
   * 🔥 Load 12 more full Pokémon objects and cache them
   * - Uses current length as offset
   * - Does NOT re-fetch existing ones
   * - Returns the *full* updated cached array
   */
  loadMorePokemons(): Observable<Pokemon[]> {
    const offset = this._pokemons.length;
    const url = `${this.baseUrl}/pokemon?offset=${offset}&limit=${this.pageSize}`;

    return this.http.get<PokemonListResponse>(url).pipe(
      // first get the list of 12 basic resources
      switchMap((res) => {
        if (res.results.length === 0) {
          // no more Pokémon – just return existing cache
          return forkJoin([] as Observable<Pokemon>[]).pipe(map(() => [] as Pokemon[]));
        }

        // now load full details for each one
        const detailRequests = res.results.map((r) => this.http.get<Pokemon>(r.url));
        return forkJoin(detailRequests);
      }),
      tap((newPokemons: Pokemon[]) => {
        // append to cache
        this._pokemons = [...this._pokemons, ...newPokemons];
      }),
      // return the full current cache
      map(() => this._pokemons)
    );
  }
}