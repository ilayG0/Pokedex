import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pokemon } from '../models/pokemon.model';
import { Observable, forkJoin, switchMap, map, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';
  private readonly pageSize = 12;

  // ---- SETTINGS ----
  private readonly FAVORITES_KEY = 'favoritePokemonIds';
  private readonly useLocalStorage = true; // 🔥 toggle this to false to disable persistence

  // ---- SIGNAL STATE ----
  private _pokemons = signal<Pokemon[]>([]);
  pokemons = this._pokemons.asReadonly();

  private _favoriteIds = signal<Set<number>>(new Set());

  // Compute favorite Pokémon directly from signals
  favoritePokemons = computed(() =>
    this._pokemons().filter(p => this._favoriteIds().has(p.id))
  );

  constructor(private http: HttpClient) {
    if (this.useLocalStorage) this.loadFavoritesFromStorage();
  }

  // -------------------------
  // FAVORITES – LOCAL STORAGE
  // -------------------------

  private loadFavoritesFromStorage(): void {
    if (!this.useLocalStorage) return;

    const raw = localStorage.getItem(this.FAVORITES_KEY);
    if (!raw) return;

    try {
      const ids: number[] = JSON.parse(raw);
      this._favoriteIds.set(new Set(ids));
    } catch {}
  }

  private saveFavoritesToStorage(): void {
    if (!this.useLocalStorage) return;

    const idsArray = Array.from(this._favoriteIds().values());
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(idsArray));
  }

  // -------------------------
  // API Requests
  // -------------------------

  getPokemon(id: number | string): Observable<Pokemon> {
    const url = `${this.baseUrl}/pokemon/${id}`;
    return this.http.get<Pokemon>(url).pipe(
      tap((pokemon) => {
        // update cached version if needed
        this._pokemons.update((list) => {
          const exists = list.some(p => p.id === pokemon.id);
          return exists
            ? list.map(p => (p.id === pokemon.id ? pokemon : p))
            : [...list, pokemon];
        });
      }),
    );
  }

  loadMorePokemons(): Observable<Pokemon[]> {
    const offset = this._pokemons().length;
    const url = `${this.baseUrl}/pokemon?offset=${offset}&limit=${this.pageSize}`;

    return this.http.get<any>(url).pipe(
      switchMap((res) => {
        const calls = res.results.map((item: any) => this.http.get<Pokemon>(item.url));
        return forkJoin(calls);
      }),
      tap((newPokemons) => {
        this._pokemons.update((prev) => [...prev, ...newPokemons]);
      }),
      map(() => this._pokemons())
    );
  }

  // -------------------------
  // FAVORITES LOGIC
  // -------------------------

  toggleFavorite(pokemon: Pokemon): void {
    const next = new Set(this._favoriteIds());

    if (next.has(pokemon.id)) {
      next.delete(pokemon.id);
    } else {
      next.add(pokemon.id);
    }

    this._favoriteIds.set(next); // 🔥 instantly updates computed() + UI

    this.saveFavoritesToStorage(); // optional
  }
}
