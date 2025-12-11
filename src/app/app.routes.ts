import { Routes } from '@angular/router';
import { PokemonInfoComponent } from './pages/pokemon-info/pokemon-info.component';
import { PokemonsHome } from './pages/home-page/pokemons-home.component';
import { FavoritPokemonsComponent } from './pages/favorit-pokemons.component/favorit-pokemons.component';

export const routes: Routes = [
{ path: '', component: PokemonsHome }, 
{ path: 'search', component: PokemonsHome }, 
{ path: 'pokemon-info/:id', component: PokemonInfoComponent },
{ path: 'favorite-pokemons', component: FavoritPokemonsComponent }
];
