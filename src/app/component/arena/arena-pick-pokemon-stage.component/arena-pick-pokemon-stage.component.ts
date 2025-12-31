import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../../../models/pokemon.model';
import { PokemonService } from '../../../services/pokemon.service';

@Component({
  selector: 'app-arena-pick-pokemon-stage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arena-pick-pokemon-stage.component.html',
  styleUrl: './arena-pick-pokemon-stage.component.scss',
})
export class ArenaPickPokemonStageComponent implements OnInit {
  pokemonService = inject(PokemonService);

  readonly favorites = this.pokemonService.favorites;

  @Input() artworkUrlFn!: (id: number | null) => string;
  @Input() titleCaseFn!: (v: string) => string;
  @Input() pokemonIdFn!: (p: Pokemon | null) => number | null;
  @Input() pokemonNameFn!: (p: Pokemon | null) => string;

  @Output() selectPokemon = new EventEmitter<Pokemon>();

  ngOnInit(): void {
    this.pokemonService.loadFavorites();
  }

  onPick(p: Pokemon): void {
    this.selectPokemon.emit(p);
  }
}
