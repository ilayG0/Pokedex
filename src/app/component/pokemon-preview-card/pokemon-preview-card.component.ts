import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonIdPipe } from '../../pipes/pokemon-id.pipe';

@Component({
  selector: 'app-pokemon-preview-card',
  standalone: true,
  imports: [PokemonIdPipe],
  templateUrl: './pokemon-preview-card.component.html',
  styleUrl: './pokemon-preview-card.component.scss',
})
export class PokemonPreviewCard {
  @Input({ required: true }) pokemon!: Pokemon;
  @Input() addCencleBtn?: boolean;
  @Output() pokemontoRemove = new EventEmitter<Pokemon>();

  onRemove(pokemon: Pokemon) {
    this.pokemontoRemove.emit(pokemon);
  }
}
