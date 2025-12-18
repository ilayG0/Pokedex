import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, map, Observable, of, switchMap } from 'rxjs';
import {
  BattleMoveDetails,
  BattleMoveLite,
  BattlePhase,
  PokemonApiResponse,
  SelectedPokemonForBattle,
} from '../models/battle.models';

@Injectable({ providedIn: 'root' })
export class BattleService {
  private readonly apiBase = 'https://pokeapi.co/api/v2';

  phase = signal<BattlePhase>('idle');
  isBusy = signal(false);

  opponentFound = signal(false);

  myPokemon = signal<SelectedPokemonForBattle | null>(null);
  myAttacks = signal<BattleMoveDetails[]>([]);

  canStartMatchmaking = computed(() => !this.isBusy() && this.phase() === 'idle');
  canEnterSelection = computed(() => this.phase() === 'selecting' && !!this.myPokemon());
  isReady = computed(() => this.phase() === 'ready' && this.myPokemon() && this.myAttacks().length === 2);

  constructor(private http: HttpClient) {}

  startMatchmaking(): void {
    if (!this.canStartMatchmaking()) return;

    this.phase.set('matchmaking');
    this.isBusy.set(true);
    this.opponentFound.set(false);

    // Placeholder: replace with your backend websocket/SignalR/REST matchmaking
    setTimeout(() => {
      this.opponentFound.set(true);
      this.phase.set('selecting');
      this.isBusy.set(false);
    }, 1200);
  }

  reset(): void {
    this.phase.set('idle');
    this.isBusy.set(false);
    this.opponentFound.set(false);
    this.myPokemon.set(null);
    this.myAttacks.set([]);
  }

  getPokemonByIdOrName(idOrName: number | string): Observable<SelectedPokemonForBattle> {
    const url = `${this.apiBase}/pokemon/${idOrName}`;
    this.isBusy.set(true);

    return this.http.get<PokemonApiResponse>(url).pipe(
      map((p) => this.mapPokemonToBattle(p)),
      finalize(() => this.isBusy.set(false))
    );
  }

  private mapPokemonToBattle(p: PokemonApiResponse): SelectedPokemonForBattle {
    const imageUrl: string | null =
      p?.sprites?.other?.['official-artwork']?.front_default ??
      p?.sprites?.front_default ??
      null;

    const stats: Record<string, number> = {};
    for (const s of p.stats ?? []) stats[s.stat.name] = s.base_stat;

    const types = (p.types ?? []).map((t) => t.type.name);

    const allMoves: BattleMoveLite[] = (p.moves ?? []).map((m) => ({
      name: m.move.name,
      url: m.move.url,
    }));

    return {
      id: p.id,
      name: p.name,
      imageUrl,
      types,
      stats,
      allMoves,
    };
  }

  selectMyPokemon(p: SelectedPokemonForBattle): void {
    this.myPokemon.set(p);
    this.myAttacks.set([]);
  }

  getMoveDetails(moveUrl: string): Observable<BattleMoveDetails> {
    if (!moveUrl) return of(null as any);
    return this.http.get<any>(moveUrl).pipe(
      map((m) => ({
        id: m.id,
        name: m.name,
        power: m.power ?? null,
        accuracy: m.accuracy ?? null,
        pp: m.pp ?? null,
        priority: m.priority ?? 0,
        type: m.type,
        damage_class: m.damage_class,
        effect_entries: m.effect_entries ?? [],
      }))
    );
  }

  toggleAttack(move: BattleMoveDetails): void {
    const current = this.myAttacks();
    const exists = current.some((x) => x.id === move.id);

    if (exists) {
      this.myAttacks.set(current.filter((x) => x.id !== move.id));
      return;
    }

    if (current.length >= 2) return; // enforce 2 attacks
    this.myAttacks.set([...current, move]);
  }

  lockInIfReady(): void {
    if (this.myPokemon() && this.myAttacks().length === 2) {
      this.phase.set('ready');
    }
  }
}