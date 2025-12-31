import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-arena-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arena-shell.component.html',
  styleUrl: './arena-shell.component.scss',
})
export class ArenaShellComponent {
  @Input() isFindingMatch = false;
  @Input() stage: 'start' | 'pickPokemon' | 'pickMoves' | 'fight' = 'start';

  @Output() fight = new EventEmitter<void>();
  @Output() backToStart = new EventEmitter<void>();

  get statusText(): string {
    return this.isFindingMatch ? 'Finding opponent...' : 'Ready';
  }

  get fightLabel(): string {
    return this.isFindingMatch ? 'MATCHING…' : 'FIGHT';
  }

  get fightSub(): string {
    return this.isFindingMatch ? 'Please wait' : 'Start a battle';
  }

  get showFooterFight(): boolean {
    console.log(this.stage)
    return this.stage === 'start';
  }

  onFight(): void {
    this.fight.emit();
  }

  onBack(): void {
    this.backToStart.emit();
  }
}
