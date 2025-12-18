import { Component, Input } from '@angular/core';

type AnyPokemon = any;

@Component({
  selector: 'app-arena-fight-stage',
  standalone: true,
  templateUrl: './arena-fight-stage.component.html',
  styleUrl: './arena-fight-stage.component.scss',
})
export class ArenaFightStageComponent {
  @Input() playerPokemon: AnyPokemon | null = null;
  @Input() playerMoves: any[] = [];
  @Input() playerArtwork = '';
  @Input() playerName = 'Player';
  @Input() isFindingMatch = false;

  // placeholder opponent (replace later with real matchmaking result)
  get opponentArtwork(): string {
    return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/34.png';
  }
}