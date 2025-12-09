export interface Pokemon {
  id: number;
  name: string;
  sprites: any;
  types: any[];
  abilities: any[];
  stats: any[];
  isFavorit?: boolean;
}