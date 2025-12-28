import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // לפי הנתיב שלך

export type BattleState = any;
export type BattleEvent = any;

@Injectable({ providedIn: 'root' })
export class BattleSocketService {
  private socket: Socket | null = null;

  constructor(private readonly authService: AuthService) {}

  private connect(): void {
    if (this.socket) return;

    const token = this.authService.getAccessToken(); 

    this.socket = io('http://localhost:3000/battle', {
      withCredentials: true,
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('✅ Battle socket connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Battle socket connect_error:', err);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinBattle(battleId: string): void {
    this.connect();
    this.socket!.emit('battle:join', { battleId });
  }

  sendAction(battleId: string, action: any): void {
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
