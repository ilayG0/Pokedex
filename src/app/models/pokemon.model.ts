export interface PokemonStatItem {
  name: string;     
  base_stat: number;
}

export interface PokemonMove {
  name: string;
  url: string;
  power?: number;   
  type: string;       
  accuracy?: number;   
}

export interface PokemonSprites {
  front_default?: string;
  front_shiny?: string;
  official_artwork?: string;
}

export interface PokemonType {
  name: string;      
}

export interface PokemonAbility {
  name: string;
  is_hidden: boolean;
}

export interface Pokemon {
  pokedexId: number;                   
  name: string;
  description: string;
  sprites: PokemonSprites;
  height?: number;
  types: PokemonType[];
  abilities: PokemonAbility[];
  stats: PokemonStatItem[];
  isFavorit?: boolean;
  moves: PokemonMove[];         

}
export interface BattlePokemon extends Pokemon {
  level: number;
  maxHp: number;
  currentHp: number;
  selectedMoves: PokemonMove[];  
  offeredMoves: PokemonMove[];   
  isFainted: boolean;
}
