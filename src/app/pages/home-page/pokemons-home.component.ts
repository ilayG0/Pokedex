import { Component, signal } from '@angular/core';
import { SearchBar } from "../../component/search-bar/search-bar.component";
import { Header } from "../../component/header/header.component";
import { PokemonListComponent } from "../../features/pokemon-list/pokemon-list.component";
import { FilterPanelComponent } from "../../component/filter-panel.component/filter-panel.component";

@Component({
  selector: 'app-pokemons-home',
  imports: [SearchBar, Header, PokemonListComponent, FilterPanelComponent],
  templateUrl: './pokemons-home.component.html',
  styleUrl: './pokemons-home.component.scss',
})
export class PokemonsHome {

  showFilter = signal(false);

  onToggleFiltersForm(){ this.showFilter.set(!this.showFilter()); }

  onSearch(form: FormData){}
}
