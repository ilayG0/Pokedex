// זה נשאר לשימוש מול PokeAPI (אם אתה עדיין משתמש בו איפשהו)
export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface ExternalPokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}

import { Pokemon } from './pokemon.model';
export interface PokemonPageResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: Pokemon[];
}
