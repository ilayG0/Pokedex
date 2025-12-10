// search-bar.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingPokeBall],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBar {
  @Output() openFilters = new EventEmitter<void>();
  @Output() search = new EventEmitter<Pokemon | null>();
  @Output() reset = new EventEmitter<void>();

  searchTerm = '';
  showDropdown = false;
  didSearch = false;
  isLoading = false;
  isMobile = window.innerWidth < 760;

  
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
    this.showDropdown = false;
  }

  onSearchClick() {
    this.isLoading = true;
    const term = this.searchTerm.trim();

    if (term === undefined || !term) {
      this.isLoading = false;
      return;
    }

    this.didSearch = true;

    // save recent search
    this.pokemonService.addRecentSearch(term);

    // get Pokémon
    this.pokemonService.getPokemon(term).subscribe({
      next: (pokemon) => {
        console.log('FOUND POKEMON:', pokemon);

        // Emit the actual Pokémon to parent component
        this.search.emit(pokemon);

        this.showDropdown = false;
        this.isLoading = false;
      },
      error: () => {
        console.log('Pokemon not found!');
        this.search.emit(null);
        this.showDropdown = false;
        this.isLoading = false;
      },
    });
  }

  onResetClick() {
    this.didSearch = false;
    this.searchTerm = '';
    this.showDropdown = false;
    this.reset.emit();
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
