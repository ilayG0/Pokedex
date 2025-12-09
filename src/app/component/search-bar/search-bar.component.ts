// search-bar.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBar {
  @Output() openFilters = new EventEmitter<void>();
  @Output() search = new EventEmitter<Pokemon>();

  searchTerm = '';
  showDropdown = false;

  constructor(private pokemonService: PokemonService) {}

  get recentSearches() {
    return this.pokemonService.recentSearches();
  }

  onOpenForm() {
    this.openFilters.emit();
  }

  onInputFocus() {
    this.showDropdown = true;
  }

  onInputClick() {
    this.showDropdown = true;
  }

  onInputBlur() {
    // דיליי קטן כדי לא לחסום קליק על האייטמים בדרופדאון
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

onSearchClick() {
  const term = this.searchTerm.trim();
  if (!term) return;

  // save recent search
  this.pokemonService.addRecentSearch(term);

  // get Pokémon
  this.pokemonService.getPokemon(term).subscribe({
    next: (pokemon) => {
      console.log("FOUND POKEMON:", pokemon);

      // Emit the actual Pokémon to parent component
      this.search.emit(pokemon);

      this.showDropdown = false;
    },
    error: () => {
      console.log("Pokemon not found!");
      // Optionally emit null or show an error message
    }
  });
}


  onSelectRecent(term: string) {
    this.searchTerm = term;
    this.onSearchClick();
  }

  onClearRecent(event: MouseEvent) {
    event.stopPropagation();
    this.pokemonService.clearRecentSearches();
  }

  onRemoveRecent(term: string, event: MouseEvent) {
    event.stopPropagation();
    this.pokemonService.removeRecentSearch(term);
  }
}
