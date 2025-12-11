import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Pokemon } from '../../models/pokemon.model';
import { Router } from '@angular/router';
import { PokemonIdPipe } from '../../pipes/pokemon-id.pipe';
import { CapitalizeFirstLetterPipe } from '../../pipes/capitalize-first-letter.pipe';

@Component({
  selector: 'app-pokemon-preview-card',
  standalone: true,
  imports: [PokemonIdPipe, CapitalizeFirstLetterPipe],
  templateUrl: './pokemon-preview-card.component.html',
  styleUrl: './pokemon-preview-card.component.scss',
})
export class PokemonPreviewCard {
  @Input({ required: true }) pokemon!: Pokemon;
  @Input({ required: true }) page!: 'home' | 'favorite' | 'info';
  @Input() addCencleBtn?: boolean;
  @Output() pokemontoRemove = new EventEmitter<Pokemon>();

  private readonly router = inject(Router);

  onRemove(pokemon: Pokemon) {
    this.pokemontoRemove.emit(pokemon);
  }
  goToPokemonFromHome(id: number): void {
    this.router.navigate(['/pokemon-info', id]);
  }
  goToPokemonFromFavorite(id: number): void {
    let isFromFavorite = true;
    this.router.navigate(['/pokemon-info', id], {
      queryParams: { isFromFavorite },
    });
  }
  goToPokemon(id: number) {
    if (this.page === 'home') {
      this.goToPokemonFromHome(id);
    }
    else if (this.page === 'favorite'){
      this.goToPokemonFromFavorite(id);
    }
  }
}
