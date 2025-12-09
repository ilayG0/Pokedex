export interface Pokemon {
  id: number;
  name: string;
  description: string;
  sprites: any;
  height?: number;
  types: any[];
  abilities: any[];
  stats: any[];
  isFavorit?: boolean;
}