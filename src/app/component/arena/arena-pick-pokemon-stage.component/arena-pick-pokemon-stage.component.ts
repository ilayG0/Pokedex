import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

type AnyPokemon = any;

@Component({
  selector: 'app-arena-pick-pokemon-stage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arena-pick-pokemon-stage.component.html',
  styleUrl: './arena-pick-pokemon-stage.component.scss',
})
export class ArenaPickPokemonStageComponent {
  @Input() favorites: AnyPokemon[] = [];

  // Pass functions from parent to avoid template casts
  @Input() artworkUrlFn!: (id: number | null) => string;
  @Input() titleCaseFn!: (v: string) => string;
  @Input() pokemonIdFn!: (p: AnyPokemon | null) => number | null;
  @Input() pokemonNameFn!: (p: AnyPokemon | null) => string;

  @Output() selectPokemon = new EventEmitter<AnyPokemon>();

  onPick(p: AnyPokemon): void {
    this.selectPokemon.emit(p);
  }
}