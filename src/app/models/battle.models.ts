export type BattlePhase = 'idle' | 'matchmaking' | 'selecting' | 'ready';

export interface PokemonListItemMove {
  move: { name: string; url: string };
  version_group_details: Array<{
    level_learned_at: number;
    move_learn_method: { name: string; url: string };
    version_group: { name: string; url: string };
  }>;
}

export interface PokemonApiResponse {
  id: number;
  name: string;
  sprites: any;
  types: Array<{ slot: number; type: { name: string; url: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string; url: string } }>;
  moves: PokemonListItemMove[];
}

export interface BattleMoveLite {
  name: string;
  url: string;
}

export interface BattleMoveDetails {
  id: number;
  name: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  type: { name: string; url: string };
  damage_class: { name: string; url: string };
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: { name: string; url: string };
  }>;
}

export interface SelectedPokemonForBattle {
  id: number;
  name: string;
  imageUrl: string | null;
  types: string[];
  stats: Record<string, number>;
  allMoves: BattleMoveLite[];
}
