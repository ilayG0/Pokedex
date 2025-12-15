import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  from,
  map,
  mergeMap,
  of,
  shareReplay,
  switchMap,
  toArray,
  catchError,
  tap,
} from 'rxjs';

import { Pokemon } from '../models/pokemon.model';
import { PokemonFilters } from '../models/pokemon-filters.model';
import { SelectOption } from '../models/pokemon-filter-selected-option.model';
import { PokemonListResponse } from '../models/pokemon-api-list-response.model';
import { environment } from '../../environments/environment.dev';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private readonly pageSize = 12;

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

  private readonly pagesCache = new Map<number, Observable<Pokemon[]>>();
  private nextPageToLoad = signal(1);

  constructor(private http: HttpClient) {
    this.loadNextPage().subscribe();
  }

  loadNextPage(): Observable<Pokemon[]> {
    const page = this.nextPageToLoad();
    this.nextPageToLoad.set(page + 1);
    return this.loadPage(page);
  }

  loadPage(page: number): Observable<Pokemon[]> {
    const safePage = Math.max(1, Math.floor(page));
    const cached = this.pagesCache.get(safePage);
    if (cached) return cached;

    const offset = (safePage - 1) * this.pageSize;
    const url = `${environment.POKEDEX_API_URL}/pokemon?limit=${this.pageSize}&offset=${offset}`;

    const req$ = this.http.get<PokemonListResponse>(url).pipe(
      map((res) => res.results ?? []),
      mergeMap((results) =>
        from(results).pipe(
          mergeMap((r) => this.http.get<any>(r.url), 10),
          toArray()
        )
      ),
      map((list) => list.slice().sort((a, b) => a.id - b.id)),
      map((list) => this.enrichFavorites(list)),
      tap((pagePokemons) => this.upsertPokemons(pagePokemons)),
      shareReplay(1)
    );

    this.pagesCache.set(safePage, req$);
    return req$;
  }

  private upsertPokemons(incoming: Pokemon[]): void {
    this._pokemons.update((prev) => {
      const byId = new Map<number, Pokemon>(prev.map((p) => [p.id, p]));
      for (const p of incoming) byId.set(p.id, p);
      return Array.from(byId.values()).sort((a, b) => a.id - b.id);
    });
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

  private enrichFavorites(list: Pokemon[]): Pokemon[] {
    const favSet = new Set(this.favoriteIds());
    return list.map((p) => ({ ...p, isFavorit: favSet.has(p.id) }));
  }

  getPokemon(idOrName: number | string): Observable<Pokemon> {
    const key = String(idOrName).trim().toLowerCase();
    if (!key) return of(null as any);

    const local = this.findPokemonInCache(key);
    if (local) return of(local);

    return this.getPokemonFromApi(key).pipe(
      tap((p) => this.upsertPokemons([p]))
    );
  }

  private findPokemonInCache(keyLower: string): Pokemon | undefined {
    const list = this._pokemons();

    const asNumber = Number(keyLower);
    if (Number.isFinite(asNumber) && asNumber > 0 && String(asNumber) === keyLower) {
      const byId = list.find((p) => p.id === asNumber);
      if (byId) return byId;
    }

    return list.find((p) => p.name?.toLowerCase() === keyLower);
  }

  private getPokemonFromApi(idOrNameLower: string | number): Observable<Pokemon> {
    const url = `${environment.POKEDEX_API_URL}/pokemon/${idOrNameLower}`;

    return this.http.get<any>(url).pipe(
      switchMap((pokemonRes) =>
        this.http.get<any>(`${environment.POKEDEX_API_URL}/pokemon-species/${pokemonRes.id}`).pipe(
          map((speciesRes) => {
            const flavorEntry = (speciesRes.flavor_text_entries ?? []).find(
              (e: any) => e.language?.name === 'en'
            );

            const description: string = flavorEntry
              ? String(flavorEntry.flavor_text)
                  .replace(/\f/g, ' ')
                  .replace(/\n/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
              : '';

            const pokemon: Pokemon = {
              ...pokemonRes,
              description,
              isFavorit: this.isFavorite(pokemonRes.id),
            };

            return pokemon;
          })
        )
      )
    );
  }

  filterPokemonsByNameOrId(term: string): Observable<Pokemon[]> {
    const clean = term.trim().toLowerCase();
    if (!clean) return of([]);

    return this.getPokemon(clean).pipe(
      map((p) => (p ? [p] : [])),
      catchError(() => of([]))
    );
  }

  searchPokemonsByFilters(filters: PokemonFilters): Observable<Pokemon[]> {
    const type = (filters.type ?? '').trim().toLowerCase();
    const group = (filters.group ?? '').trim().toLowerCase();
    const color = (filters.color ?? '').toString().trim().toLowerCase();
    const height = filters.height;

    const hasType = !!type;
    const hasGroup = !!group;
    const hasColor = color.length > 0 && color !== 'null' && color !== 'undefined';
    const hasHeight = height != null;

    const intersect = (a: Set<number>, b: Set<number>): Set<number> => {
      if (a.size === 0) return new Set(b);
      if (b.size === 0) return new Set(a);
      const out = new Set<number>();
      const small = a.size <= b.size ? a : b;
      const big = a.size <= b.size ? b : a;
      for (const v of small) if (big.has(v)) out.add(v);
      return out;
    };

    const idsFromColor$ = !hasColor
      ? of<Set<number> | null>(null)
      : this.http
          .get<{ pokemon_species: { name: string; url: string }[] }>(
            `${environment.POKEDEX_API_URL}/pokemon-color/${color}`
          )
          .pipe(
            map((res) => res.pokemon_species ?? []),
            map((species) => {
              const ids = species
                .map((s) => Number(String(s.url).split('/').filter(Boolean).pop()))
                .filter((n) => Number.isFinite(n));
              return new Set<number>(ids);
            }),
            catchError(() => of(new Set<number>()))
          );

    const idsFromType$ = !hasType
      ? of<Set<number> | null>(null)
      : this.http.get<any>(`${environment.POKEDEX_API_URL}/type/${type}`).pipe(
          map((res) => res.pokemon ?? []),
          map((arr: any[]) => {
            const ids = arr
              .map((x) => Number(String(x?.pokemon?.url || '').split('/').filter(Boolean).pop()))
              .filter((n) => Number.isFinite(n));
            return new Set<number>(ids);
          }),
          catchError(() => of(new Set<number>()))
        );

    const idsFromGroup$ = !hasGroup
      ? of<Set<number> | null>(null)
      : this.http.get<any>(`${environment.POKEDEX_API_URL}/egg-group/${group}`).pipe(
          map((res) => res.pokemon_species ?? []),
          map((arr: any[]) => {
            const ids = arr
              .map((x) => Number(String(x?.url || '').split('/').filter(Boolean).pop()))
              .filter((n) => Number.isFinite(n));
            return new Set<number>(ids);
          }),
          catchError(() => of(new Set<number>()))
        );

    return idsFromColor$.pipe(
      switchMap((colorSet) => idsFromType$.pipe(map((typeSet) => ({ colorSet, typeSet })))),
      switchMap(({ colorSet, typeSet }) =>
        idsFromGroup$.pipe(map((groupSet) => ({ colorSet, typeSet, groupSet })))
      ),
      switchMap(({ colorSet, typeSet, groupSet }) => {
        const sets = [colorSet, typeSet, groupSet].filter((s): s is Set<number> => s instanceof Set);

        if (sets.length === 0) {
          return of([] as Pokemon[]);
        }

        let candidates = new Set<number>(sets[0]);
        for (let i = 1; i < sets.length; i++) candidates = intersect(candidates, sets[i]);

        const ids = Array.from(candidates).sort((a, b) => a - b);
        if (!ids.length) return of([] as Pokemon[]);

        return from(ids).pipe(
          mergeMap((id) => this.http.get<any>(`${environment.POKEDEX_API_URL}/pokemon/${id}`), 10),
          map((pokemonRes) => ({ ...pokemonRes, isFavorit: this.isFavorite(pokemonRes.id) }) as Pokemon),
          toArray(),
          map((list) => list.slice().sort((a, b) => a.id - b.id)),
          map((list) => (hasHeight ? list.filter((p) => p.height === height) : list)),
          tap((list) => this.upsertPokemons(list)),
          catchError(() => of([]))
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
}
