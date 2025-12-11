import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
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
  @Output() search = new EventEmitter<string>();
  @Output() reset = new EventEmitter<void>();
  pokemonService = inject(PokemonService);

  searchTerm = '';
  showDropdown = false;
  didSearch = false;
  isLoading = false;
  isMobile = signal(window.innerWidth < 670);
  filteredPokemons = signal<Pokemon[]>([]);

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 670);
    });
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    this.search.emit(value);
  }
  onSearch() {
    this.pokemonService.addRecentSearch(this.searchTerm);
  }

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

  onResetClick() {
    this.didSearch = false;
    this.searchTerm = '';
    this.showDropdown = false;
    this.reset.emit();
  }

  onSelectRecent(term: string) {
    this.searchTerm = term;
    this.onSearchChange(term);
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
