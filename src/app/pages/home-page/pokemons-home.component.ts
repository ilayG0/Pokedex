import { Component } from '@angular/core';
import { SearchBar } from "../../component/search-bar/search-bar.component";
import { Header } from "../../component/header/header.component";
import { PokemonListComponent } from "../../features/pokemon-list/pokemon-list.component";

@Component({
  selector: 'app-pokemons-home',
  imports: [SearchBar, Header, PokemonListComponent],
  templateUrl: './pokemons-home.component.html',
  styleUrl: './pokemons-home.component.scss',
})
export class PokemonsHome {

}
