type BattlePlayerState = {
  userId: string;
  pokemonId: number;
  pokemonName: string;
  maxHp: number;
  currentHp: number;
  moves: { id: number; name: string; power: number }[];
};

type BattleState = {
  id: string;              
  players: [BattlePlayerState, BattlePlayerState];
  activePlayerId: string;    
  turnNumber: number;
  turnExpiresAt: number;    
  status: 'PENDING' | 'ACTIVE' | 'FINISHED';
  winnerId?: string;
};
