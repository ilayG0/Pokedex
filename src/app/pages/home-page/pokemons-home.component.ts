import { Component, signal } from '@angular/core';
import { SearchBar } from "../../component/search-bar/search-bar.component";
import { Header } from "../../component/header/header.component";
import { PokemonListComponent } from "../../features/pokemon-list/pokemon-list.component";
import { FilterPanelComponent } from "../../component/filter-panel.component/filter-panel.component";
import { Pokemon } from '../../models/pokemon.model';

@Component({
  selector: 'app-pokemons-home',
  imports: [SearchBar, Header, PokemonListComponent, FilterPanelComponent],
  templateUrl: './pokemons-home.component.html',
  styleUrl: './pokemons-home.component.scss',
})
export class PokemonsHome {
  filters =signal(null);
  searchPokemon =signal<Pokemon | null>( null);
  showFilter = signal(false);

  onToggleFiltersForm(){ this.showFilter.set(!this.showFilter()); }

  onSearch(form: any){
    this.filters.set(form);
  }

  onFoundPokemon(pokemon: Pokemon){
    this.searchPokemon.set(pokemon);
  }
}
