import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
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

  // 🔹 key ל-localStorage
  private readonly RECENT_SEARCHES_KEY = 'pokemon_recent_searches';

  // 🔹 All pokemons
  private _pokemons = signal<Pokemon[]>([]);
  pokemons = this._pokemons.asReadonly();

  // 🔹 Favorite pokemons
  private _favoritePokemons = signal<Pokemon[]>([]);
  favoritePokemons = this._favoritePokemons.asReadonly();

  // 🔹 Recent searches
  private _recentSearches = signal<string[]>(this.loadRecentSearchesFromStorage());
  recentSearches = this._recentSearches.asReadonly();

  constructor(private http: HttpClient) {}


  // =========================================================
  // ✅ חיפוש לפי שם
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
  // ✅ לוגיקה של recent searches
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
      // נוכל להתעלם משגיאות localStorage
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

            const isFav = this._favoritePokemons().some(
              (p) => p.id === pokemonRes.id
            );

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

  /**
   * 🎯 Search pokemons from the API based on filters.
   * Does NOT touch the existing pokemons signal or pagination logic.
   */
  searchPokemonsWithFilters(filters: {
    name?: string;
    height?: number;
    type?: string;
    group?: string;
  }): Observable<Pokemon[]> {
    const normalizedName = filters.name?.trim().toLowerCase() || '';

    // נשמור את הפייבוריטים כדי להחזיר isFavorit נכון
    const favoriteIds = new Set(this._favoritePokemons().map((p) => p.id));

    // 1️⃣ בוחרים מקור בסיס
    let base$: Observable<string[]>; // רשימת שמות פוקימונים שנביא עליהם פרטים

    if (filters.type) {
      // בסיס לפי סוג
      base$ = this.http
        .get<any>(`${this.baseUrl}/type/${filters.type}`)
        .pipe(map((res) => res.pokemon.map((p: any) => p.pokemon.name)));
    } else if (filters.group) {
      // בסיס לפי egg group (מוחזר species -> name)
      base$ = this.http
        .get<any>(`${this.baseUrl}/egg-group/${filters.group}`)
        .pipe(map((res) => res.pokemon_species.map((s: any) => s.name)));
    } else if (normalizedName) {
      // ניסיון להביא פוקימון לפי שם מדויק
      base$ = this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${normalizedName}`).pipe(
        map((p) => [p.name]),
        catchError(() => of([] as string[]))
      );
    } else {
      // ברירת מחדל: נביא batch ראשון גדול
      base$ = this.http
        .get<PokemonListResponse>(`${this.baseUrl}/pokemon?limit=200&offset=0`)
        .pipe(map((res) => res.results.map((r) => r.name)));
    }

    // 2️⃣ מביאים פרטים מלאים על כל הפוקימונים מהבסיס
    return base$.pipe(
      switchMap((names) => {
        if (!names.length) {
          return of([] as Pokemon[]);
        }

        const requests = names.map((name) =>
          this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${name}`)
        );

        return forkJoin(requests);
      }),

      // 3️⃣ מסננים לפי הפילטרים
      map((pokemons) => {
        let list = pokemons;

        // שם - מכיל
        if (normalizedName) {
          list = list.filter((p) => p.name.toLowerCase().includes(normalizedName));
        }

        // גובה - התאמה מדויקת
        if (filters.height !== undefined && filters.height !== null && filters.height !== 0) {
          list = list.filter((p) => p.height === filters.height);
        }

        // סוג - לוודא שגם הרשומות עצמן מכילות את הסוג
        if (filters.type) {
          list = list.filter((p) => p.types?.some((t: any) => t.type?.name === filters.type));
        }

        // קבוצה (egg group) — פה זה קצת יותר טריקי כי /pokemon לא מחזיר egg_groups.
        // אפשר לדלג או להשאיר TODO. כרגע רק נשאיר את הפילטר ברמת המקור.
        // אם תרצה, אפשר להרחיב עם קריאות /pokemon-species.

        // 4️⃣ מוסיפים isFavorit לפי רשימת הפייבוריטים
        return list.map((p) =>
          favoriteIds.has(p.id) ? { ...p, isFavorit: true } : { ...p, isFavorit: false }
        );
      })
    );
  }
}
