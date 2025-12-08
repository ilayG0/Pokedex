import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./component/header/header";
import { SearchBar } from "./component/search-bar/search-bar";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, SearchBar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('pokedex-project');
}
