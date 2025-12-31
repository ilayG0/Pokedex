import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { BattleState, BattleEvent } from '../../../services/arena.service';

type AnyPokemon = any;

@Component({
  selector: 'app-arena-fight-stage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arena-fight-stage.component.html',
  styleUrl: './arena-fight-stage.component.scss',
})
export class ArenaFightStageComponent implements OnInit, OnChanges, OnDestroy {
  @Input() playerPokemon: AnyPokemon | null = null;
  @Input() playerMoves: any[] = [];
  @Input() playerArtwork = '';
  @Input() playerName = 'Player';
  @Input() isFindingMatch = false;

  @Input() opponentName = 'Opponent';
  @Input() opponentMoves: any[] = [];
  @Input() opponentArtwork = '';

  @Input() battleState: BattleState | null = null;
  @Input() battleEvents: BattleEvent[] = [];
  @Input() selfUserId: string | null = null;

  @Output() moveChosen = new EventEmitter<any>();
  @Output() backToStart = new EventEmitter<void>();

  remainingSeconds = 30;
  private timerId: any;

  playerFxClass = '';
  opponentFxClass = '';
  damageAmount: number | null = null;
  damageSide: 'player' | 'opponent' | null = null;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone
  ) {}

  get hasOpponent(): boolean {
    return !!this.opponentArtwork;
  }

  get isMyTurn(): boolean {
    if (!this.battleState || !this.selfUserId) return false;
    return this.battleState.activePlayerId === this.selfUserId;
  }

  get isFinished(): boolean {
    return !!this.battleState && this.battleState.status === 'FINISHED';
  }

  get isWinner(): boolean {
    if (!this.isFinished || !this.selfUserId) return false;
    return this.battleState!.winnerId === this.selfUserId;
  }

  get turnLabel(): string {
    if (!this.battleState) return '';
    if (this.isFinished) {
      if (this.isWinner) return 'You won!';
      return 'You lost';
    }
    return this.isMyTurn ? 'Your turn' : `${this.opponentName || 'Opponent'}’s turn`;
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.timerId = setInterval(() => {
        this.tickTimer();
        this.zone.run(() => {
          this.cdr.markForCheck();
        });
      }, 250);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['battleEvents']) {
      this.processEvents();
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timerId);
  }

  private tickTimer(): void {
    if (!this.battleState || !this.battleState.turnExpiresAt || this.isFinished) {
      this.remainingSeconds = this.isFinished ? 0 : 30;
      return;
    }
    const now = Date.now();
    const diffMs = this.battleState.turnExpiresAt - now;
    this.remainingSeconds = Math.max(0, Math.ceil(diffMs / 1000));
  }

  private processEvents(): void {
    if (!this.battleEvents || !this.battleEvents.length) return;

    const lastDamage = [...this.battleEvents].reverse().find((e: any) => e.type === 'DAMAGE');
    if (!lastDamage) return;

    const targetId = lastDamage.target as string;
    const amount = Number(lastDamage.amount ?? 0);
    const isOnMe = this.selfUserId && targetId === this.selfUserId;

    this.damageAmount = amount;
    this.damageSide = isOnMe ? 'player' : 'opponent';

    const fxClass = this.randomHitFx();
    if (isOnMe) {
      this.playerFxClass = fxClass;
    } else {
      this.opponentFxClass = fxClass;
    }

    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.playerFxClass = '';
        this.opponentFxClass = '';
        this.damageAmount = null;
        this.damageSide = null;

        this.zone.run(() => {
          this.cdr.markForCheck();
        });
      }, 3000);
    });

    this.cdr.markForCheck();
  }

  private randomHitFx(): string {
    const options = ['fx-hit-1', 'fx-hit-2', 'fx-hit-3'];
    return options[Math.floor(Math.random() * options.length)];
  }

  get playerHpPercent(): number {
    if (!this.battleState || !Array.isArray(this.battleState.players) || this.battleState.players.length < 2) {
      return 100;
    }
    const idx = this.resolvePlayerIndex();
    const p = this.battleState.players[idx];
    return (p.currentHp / p.maxHp) * 100;
  }

  get opponentHpPercent(): number {
    if (!this.battleState || !Array.isArray(this.battleState.players) || this.battleState.players.length < 2) {
      return 100;
    }
    const idx = this.resolvePlayerIndex() === 0 ? 1 : 0;
    const p = this.battleState.players[idx];
    return (p.currentHp / p.maxHp) * 100;
  }

  private resolvePlayerIndex(): number {
    if (!this.battleState || !Array.isArray(this.battleState.players)) return 0;
    const players = this.battleState.players;
    const myPokeId = Number(this.playerPokemon?.id ?? this.playerPokemon?.pokedexId);
    const foundIdx = players.findIndex((p: any) => Number(p.pokemonId) === myPokeId);
    return foundIdx >= 0 ? foundIdx : 0;
  }

  onMoveClick(move: any): void {
    if (!move) return;
    if (!this.isMyTurn || this.isFinished) return;
    this.moveChosen.emit(move);
  }

  onBackToStart(): void {
    this.backToStart.emit();
  }
}
