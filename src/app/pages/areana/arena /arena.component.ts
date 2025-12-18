import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonService } from '../../../services/pokemon.service';

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
export class ArenaComponent {
  // stages
  readonly stage = signal<ArenaStage>('start');

  // matchmaking / status
  readonly isFindingMatch = signal(false);

  // user choices
  readonly selectedPokemon = signal<AnyPokemon | null>(null);
  readonly selectedMoves = signal<any[]>([]); // 3 moves

  // Your favorites: if your service has favoritePokemons computed, use it.
  // If not, adapt this to what you have (IDs or objects).
  readonly favoritePokemons = computed<AnyPokemon[]>(() => {
    const list = (this.pokemonService as any).favoritePokemons?.() ?? [];
    return Array.isArray(list) ? list : [];
  });

  constructor(private pokemonService: PokemonService) {}

  // -------------------------------
  // Flow actions
  // -------------------------------
  goStart(): void {
    this.stage.set('start');
    this.isFindingMatch.set(false);
    this.selectedPokemon.set(null);
    this.selectedMoves.set([]);
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
  }

  enterBattle(): void {
    // Keep your existing logic; this just simulates matching.
    if (this.isFindingMatch()) return;
    this.isFindingMatch.set(true);

    // simulate “finding opponent”
    setTimeout(() => {
      this.isFindingMatch.set(false);
      // You can trigger your real match-found event here.
    }, 900);
  }

  // -------------------------------
  // Template-safe helpers (NO "as any" in HTML)
  // -------------------------------
  pokemonId(p: AnyPokemon | null): number | null {
    if (!p) return null;
    const id = Number(p.id);
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