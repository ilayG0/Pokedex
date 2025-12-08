import { Routes } from '@angular/router';
import { PokemonInfoComponent } from './pages/pokemon-info.component';

export const routes: Routes = [
  /* { path: '', component: PokemonListComponent }, */
  { path: 'pokemon-info/:id', component: PokemonInfoComponent }
];
