import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

export type MatchFoundPayload = {
  roomId: string;
  battleId: string;
  selfUserId: string;
  opponent: {
    name: string;
    artwork: string;
    pokemonId: number;
    moves: any[];
  };
};

export type BattleState = any;
export type BattleEvent = any;

@Injectable({ providedIn: 'root' })
export class ArenaSocketService {
  private socket: Socket | null = null;

  connect(): void {
    if (this.socket) return;

    this.socket = io('http://localhost:3000', {
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected, id =', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connect_error:', err);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  findMatch(payload: { name: string; artwork: string; pokemonId: number; moves: any[] }): void {
    this.connect();
    console.log('🔼 emit find_match:', payload);
    this.socket!.emit('find_match', payload);
  }

  cancelMatch(): void {
    this.socket?.emit('cancel_match');
  }

  onMatchFound(): Observable<MatchFoundPayload> {
    return new Observable((sub) => {
      this.connect();
      const handler = (data: MatchFoundPayload) => {
        console.log('🎯 match_found:', data);
        sub.next(data);
      };
      this.socket!.on('match_found', handler);
      return () => this.socket?.off('match_found', handler);
    });
  }

  onOpponentLeft(): Observable<{ roomId: string }> {
    return new Observable((sub) => {
      this.connect();
      const handler = (data: { roomId: string }) => {
        console.log('👋 opponent_left:', data);
        sub.next(data);
      };
      this.socket!.on('opponent_left', handler);
      return () => this.socket?.off('opponent_left', handler);
    });
  }

  joinBattle(battleId: string): void {
    this.connect();
    this.socket!.emit('battle:join', { battleId });
  }

  sendBattleAction(battleId: string, action: any): void {
    this.connect();
    this.socket!.emit('battle:action', { battleId, action });
  }

  onBattleState(): Observable<BattleState> {
    return new Observable((sub) => {
      this.connect();
      const handler = (state: BattleState) => sub.next(state);
      this.socket!.on('battle:state', handler);
      return () => this.socket?.off('battle:state', handler);
    });
  }

  onBattleEvents(): Observable<BattleEvent[]> {
    return new Observable((sub) => {
      this.connect();
      const handler = (events: BattleEvent[]) => sub.next(events);
      this.socket!.on('battle:events', handler);
      return () => this.socket?.off('battle:events', handler);
    });
  }
}
