import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Pokemon } from '../../models/pokemon.model';
import { Router } from '@angular/router';
import { PokemonIdPipe } from '../../pipes/pokemon-id.pipe';
import { CommonModule } from '@angular/common';
import { CapitalizeFirstLetterPipe } from '../../pipes/capitalize-first-letter.pipe';
import { PokemonService } from '../../services/pokemon.service';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [CommonModule, PokemonIdPipe, CapitalizeFirstLetterPipe],
  templateUrl: './pokemon-card.component.html',
  styleUrl: './pokemon-card.component.scss',
})
export class PokemonCard {
  @Input({ required: true }) pokemon!: Pokemon;
  @Input({ required: true }) page!: 'home' | 'favorite' | 'info';
  @Input() addCancelBtn = false;

  @Output() pokemonToRemove = new EventEmitter<Pokemon>();

  pokemonService = inject(PokemonService);

  private readonly router = inject(Router);

  statsLeft = [
    { label: 'HP', key: 'hp' },
    { label: 'Attack', key: 'attack' },
    { label: 'Defense', key: 'defense' },
  ];

  statsRight = [
    { label: 'Special Atk', key: 'special-attack' },
    { label: 'Special Def', key: 'special-defense' },
    { label: 'Speed', key: 'speed' },
  ];

  getStat(statName: string): number | string {
    if (!this.pokemon?.stats) return '-';
    const stat = this.pokemon.stats.find((s: any) => s.stat.name === statName);
    return stat?.base_stat ?? '-';
  }

  get totalStats(): number | string {
    if (!this.pokemon?.stats) return '-';
    return this.pokemon.stats.reduce((sum: number, s: any) => sum + (s.base_stat ?? 0), 0);
  }

  onRemove(): void {
    console.log("DFdf")
    this.pokemonToRemove.emit(this.pokemon);
  }
  goToPokemonFromHome(id: number): void {
    this.router.navigate(['/pokemon-info', id]);
  }
  private goToPokemonFromFavorite(id: number): void {
    this.router.navigate(['/pokemon-info', id], {
      queryParams: { isFromFavorite: true },
    });
  }
  goToPokemon(id: number) {
    if (this.page === 'home') {
      this.goToPokemonFromHome(id);
    } else if (this.page === 'favorite') {
      this.goToPokemonFromFavorite(id);
    }
  }
  onToggleFavorite(pokemon: Pokemon) {
    this.pokemon.isFavorit = !this.pokemon.isFavorit;
    this.pokemonService.toggleFavorite(pokemon);
  }
}
