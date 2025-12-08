import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./component/header/header";
import { SearchBar } from "./component/search-bar/search-bar";
import { PokemonListComponent } from "./features/pokemon-list/pokemon-list";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, SearchBar, PokemonListComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('pokedex-project');
}
