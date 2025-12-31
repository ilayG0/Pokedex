import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PokemonService } from '../../../services/pokemon.service';
import { ArenaSocketService, MatchFoundPayload, BattleState, BattleEvent } from '../../../services/arena.service';

import { ArenaShellComponent } from '../../../component/arena/arena-shell/arena-shell.component';
import { ArenaStartStageComponent } from '../../../component/arena/arena-start-stage.component/arena-start-stage.component';
import { ArenaPickPokemonStageComponent } from '../../../component/arena/arena-pick-pokemon-stage.component/arena-pick-pokemon-stage.component';
import { ArenaPickMovesStageComponent } from '../../../component/arena/arena-pick-moves-stage.component/arena-pick-moves-stage.component';
import { ArenaFightStageComponent } from '../../../component/arena/arena-fight-stage.component/arena-fight-stage.component';

type AnyPokemon = any;
type ArenaStage = 'start' | 'pickPokemon' | 'pickMoves' | 'fight';

@Component({
  selector: 'app-arena',
  standalone: true,
  imports: [
    CommonModule,
    ArenaShellComponent,
    ArenaStartStageComponent,
    ArenaPickPokemonStageComponent,
    ArenaPickMovesStageComponent,
    ArenaFightStageComponent,
  ],
  templateUrl: './arena.component.html',
})
export class ArenaComponent implements OnInit, OnDestroy {
  readonly stage = signal<ArenaStage>('start');
  readonly isFindingMatch = signal(false);

  readonly selectedPokemon = signal<AnyPokemon | null>(null);
  readonly selectedMoves = signal<any[]>([]);

  readonly favoritePokemons = computed<AnyPokemon[]>(() => {
    const list = (this.pokemonService as any).favoritePokemons?.() ?? [];
    return Array.isArray(list) ? list : [];
  });

  readonly roomId = signal<string | null>(null);
  readonly battleId = signal<string | null>(null);
  readonly selfUserId = signal<string | null>(null);

  readonly opponentName = signal<string>('Opponent');
  readonly opponentArtwork = signal<string>('');
  readonly opponentMoves = signal<any[]>([]);

  readonly battleState = signal<BattleState | null>(null);
  readonly battleEvents = signal<BattleEvent[]>([]);

  private readonly subs = new Subscription();

  constructor(
    private readonly pokemonService: PokemonService,
    private readonly arenaSocket: ArenaSocketService
  ) {}

  ngOnInit(): void {
    const subMatch = this.arenaSocket.onMatchFound().subscribe((payload: MatchFoundPayload) => {
      this.roomId.set(payload.roomId);
      this.battleId.set(payload.battleId);
      this.selfUserId.set(payload.selfUserId);

      this.opponentName.set(payload.opponent.name);
      this.opponentArtwork.set(payload.opponent.artwork);
      this.opponentMoves.set(payload.opponent.moves);
      this.isFindingMatch.set(false);

      const id = this.battleId();
      if (id) {
        this.arenaSocket.joinBattle(id);
      }
    });

    const subState = this.arenaSocket.onBattleState().subscribe((state) => {
      this.battleState.set(state);
    });

    const subEvents = this.arenaSocket.onBattleEvents().subscribe((events) => {
      this.battleEvents.set(events);
    });

    this.subs.add(subMatch);
    this.subs.add(subState);
    this.subs.add(subEvents);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.arenaSocket.cancelMatch();
    this.arenaSocket.disconnect();
  }

  goStart(): void {
    this.stage.set('start');
    this.isFindingMatch.set(false);
    this.selectedPokemon.set(null);
    this.selectedMoves.set([]);
    this.roomId.set(null);
    this.battleId.set(null);
    this.selfUserId.set(null);
    this.opponentName.set('Opponent');
    this.opponentArtwork.set('');
    this.opponentMoves.set([]);
    this.battleState.set(null);
    this.battleEvents.set([]);
  }

  startBattle(): void {
    this.stage.set('pickPokemon');
  }

  onPokemonChosen(pokemon: AnyPokemon): void {
    this.selectedPokemon.set(pokemon);
    this.stage.set('pickMoves');
  }

  onMovesChosen(moves: any[]): void {
    this.selectedMoves.set(moves);
    this.stage.set('fight');
    this.enterBattle();
  }

  enterBattle(): void {
    console.log('enterBattle() called');

    if (this.isFindingMatch()) {
      console.log('already finding match, abort');
      return;
    }

    const pokemon = this.selectedPokemon();
    const moves = this.selectedMoves();

    console.log('selectedPokemon:', pokemon);
    console.log('selectedMoves:', moves);

    if (!pokemon || !moves || moves.length === 0) {
      console.log(' missing pokemon or moves, not sending find_match');
      return;
    }

    const pokemonId = this.pokemonId(pokemon);
    if (!pokemonId) {
      console.log(' invalid pokemonId, not sending find_match');
      return;
    }

    const payload = {
      name: this.titleCase(this.pokemonName(pokemon)) || 'Player',
      artwork: this.artworkUrl(pokemonId),
      pokemonId,
      moves,
    };

    console.log(' sending find_match payload:', payload);

    this.isFindingMatch.set(true);
    this.arenaSocket.findMatch(payload);
  }

  onMoveChosen(move: any): void {
    const battleId = this.battleId();
    if (!battleId) return;

    const moves = this.selectedMoves();
    const idx = moves.findIndex((m) => m === move);
    const moveId = idx >= 0 ? idx : 0;

    this.arenaSocket.sendBattleAction(battleId, {
      type: 'ATTACK',
      moveId,
    });
  }

  pokemonId(p: AnyPokemon | null): number | null {
    if (!p) return null;
    const id = Number(p.id ?? p.pokedexId);
    return Number.isFinite(id) ? id : null;
  }

  pokemonName(p: AnyPokemon | null): string {
    return (p?.name ?? '').toString();
  }

  titleCase(value: string): string {
    if (!value) return '';
    return value
      .split('-')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  artworkUrl(id: number | null): string {
    const safeId = id && id > 0 ? id : 5;
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${safeId}.png`;
  }
}
