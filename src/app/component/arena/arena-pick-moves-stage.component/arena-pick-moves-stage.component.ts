import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

type AnyPokemon = any;

@Component({
  selector: 'app-arena-pick-moves-stage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arena-pick-moves-stage.component.html',
  styleUrl: './arena-pick-moves-stage.component.scss',
})
export class ArenaPickMovesStageComponent {
  @Input() pokemon: AnyPokemon | null = null;
  @Input() titleCaseFn!: (v: string) => string;

  @Output() confirmMoves = new EventEmitter<any[]>();

  readonly chosen = new Set<string>();

  // only first 5 moves of pokemon
  get firstFiveMoves(): any[] {
    const moves = this.pokemon?.moves ?? [];
    return Array.isArray(moves) ? moves.slice(0, 5) : [];
  }

  isPicked(moveName: string): boolean {
    return this.chosen.has(moveName);
  }

  toggle(moveName: string, moveObj: any): void {
    if (!moveName) return;

    if (this.chosen.has(moveName)) {
      this.chosen.delete(moveName);
      return;
    }

    if (this.chosen.size >= 3) return;

    this.chosen.add(moveName);
  }

  onConfirm(): void {
    const pool = this.firstFiveMoves;

    const selected = pool
      .filter((m) => this.chosen.has((m?.move?.name ?? '').toString()))
      .map((m) => m?.move);

    if (selected.length !== 3) return;

    this.confirmMoves.emit(selected);
  }
}