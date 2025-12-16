import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  from,
  map,
  mergeMap,
  of,
  switchMap,
  take,
  toArray,
  finalize,
} from 'rxjs';

import { Pokemon } from '../models/pokemon.model';
import { PokemonFilters } from '../models/pokemon-filters.model';
import { SelectOption } from '../models/pokemon-filter-selected-option.model';
import { PokemonListResponse } from '../models/pokemon-api-list-response.model';
import { environment } from '../../environments/environment.dev';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private readonly pokemons_limit = 12;
  private pokemons_offset = 0;

  isLoadingPage = signal(false);

  private _pokemons = signal<Pokemon[]>([]);
  pokemons = this._pokemons.asReadonly();

  favoriteIds = signal<number[]>(this.loadFavoriteIds());
  favoriteCount = computed(() => this.favoriteIds().length);

  favoritePokemons = computed<Pokemon[]>(() => {
    const favSet = new Set(this.favoriteIds());
    return this._pokemons().filter((p) => favSet.has(p.id));
  });

  private _recentSearches = signal<string[]>(this.loadRecentSearchesFromStorage());
  recentSearches = this._recentSearches.asReadonly();

  private _typeOptions = signal<SelectOption[]>([]);
  typeOptions = this._typeOptions.asReadonly();

  private _groupOptions = signal<SelectOption[]>([]);
  groupOptions = this._groupOptions.asReadonly();

  private inFlightFavoriteLoads = new Set<number>();

  constructor(private http: HttpClient) {
    effect(() => {
      const ids = this.favoriteIds();
      const list = this._pokemons();

      if (list.length !== 0) return;
      if (ids.length === 0) return;

      for (const id of ids) {
        if (this.inFlightFavoriteLoads.has(id)) continue;
        this.inFlightFavoriteLoads.add(id);

        this.getPokemonByNameOrId(id)
          .pipe(
            take(1),
            finalize(() => this.inFlightFavoriteLoads.delete(id))
          )
          .subscribe();
      }
    });
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
  }

  load12Pokemons(): void {
    if (this.isLoadingPage()) return;
    this.isLoadingPage.set(true);

    const url = `${environment.POKEDEX_API_URL}/pokemon?limit=${this.pokemons_limit}&offset=${this.pokemons_offset}`;

    this.http
      .get<PokemonListResponse>(url)
      .pipe(
        map((res) => res.results ?? []),
        mergeMap((results) =>
          from(results).pipe(
            mergeMap((r) => this.http.get<Pokemon>(r.url), 10),
            toArray()
          )
        ),
        map((arr) => arr.slice().sort((a, b) => a.id - b.id))
      )
      .subscribe({
        next: (sorted) => {
          const favSet = new Set(this.favoriteIds());
          const newPokemons = sorted.map((p) => ({
            ...p,
            isFavorit: favSet.has(p.id),
          }));

          this._pokemons.update((list) => {
            const byId = new Map<number, Pokemon>();
            for (const p of list) byId.set(p.id, p);
            for (const p of newPokemons) byId.set(p.id, p); 
            return Array.from(byId.values()).sort((a, b) => a.id - b.id);
          });

          this.pokemons_offset += this.pokemons_limit;
        },
        error: () => this.isLoadingPage.set(false),
        complete: () => this.isLoadingPage.set(false),
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

  getPokemonByNameOrId(idOrName: number | string): Observable<Pokemon> {
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

            this._pokemons.update((prev) => {
              const idx = prev.findIndex((p) => p.id === pokemon.id);
              if (idx >= 0) {
                const next = prev.slice();
                next[idx] = pokemon;
                return next.sort((a, b) => a.id - b.id);
              }
              return [...prev, pokemon].sort((a, b) => a.id - b.id);
            });

            return pokemon;
          })
        )
      )
    );
  }
}
