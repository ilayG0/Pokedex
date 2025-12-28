type BattlePlayerState = {
  userId: string;
  pokemonId: number;
  pokemonName: string;
  maxHp: number;
  currentHp: number;
  moves: { id: number; name: string; power: number }[];
};

type BattleState = {
  id: string;                // battleId = roomId
  players: [BattlePlayerState, BattlePlayerState];
  activePlayerId: string;    // userId של מי שהתור שלו
  turnNumber: number;
  turnExpiresAt: number;     // timestamp (ms) עכשיו + 30s
  status: 'PENDING' | 'ACTIVE' | 'FINISHED';
  winnerId?: string;
};
