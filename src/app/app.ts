import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./component/header/header.component";
import { SearchBar } from "./component/search-bar/search-bar.component";
import { PokemonListComponent } from "./features/pokemon-list/pokemon-list.component";
import { PokemonsHome } from "./pages/home-page/pokemons-home.component";

@Component({
  selector: 'app-root',
  imports: [Header, SearchBar, PokemonListComponent, RouterOutlet, PokemonsHome],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('pokedex-project');
}
