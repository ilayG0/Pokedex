// battle-socket.service.ts
import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment.dev';

@Injectable({ providedIn: 'root' })
export class BattleSocketService {
  private readonly auth = inject(AuthService);
  private socket?: Socket;

  private state$ = new BehaviorSubject<any>(null);
  battleState$: Observable<any> = this.state$.asObservable();

  connect() {
    if (this.socket?.connected) return;

    const token = this.auth.getAccessToken(); // מה-localStorage. 
    this.socket = io(`/battle`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => console.log('battle socket connected'));
    this.socket.on('battle:state', (state) => this.state$.next(state));
    this.socket.on('battle:events', (events) => {
      // אפשר להפוך ל-stream נוסף אם צריך
    });

    this.socket.on('connect_error', (err) => {
      console.error('socket connect_error', err.message);
    });
  }

  joinBattle(battleId: string) {
    this.socket?.emit('battle:join', { battleId });
  }

  sendAction(battleId: string, action: any) {
    this.socket?.emit('battle:action', { battleId, action });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
    this.state$.next(null);
  }
}
