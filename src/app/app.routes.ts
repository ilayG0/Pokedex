import { Routes } from '@angular/router';
import { PokemonInfoComponent } from './pages/pokemon-info/pokemon-info.component';
import { PokemonsHome } from './pages/home-page/pokemons-home.component';

export const routes: Routes = [
{ path: '', component: PokemonsHome }, 
{ path: 'pokemon-info/:id', component: PokemonInfoComponent }
];
