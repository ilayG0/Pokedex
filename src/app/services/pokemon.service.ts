
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface Pokemon {
  id: number;
  name: string;
  sprites: any;
  types: any[];
  abilities: any[];
  stats: any[];
}

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';

  constructor(private http: HttpClient) {}

  // Get a page of Pokémon (12 by default)
  getPokemonList(page: number = 1, limit: number = 12): Observable<PokemonListResponse> {
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
}

