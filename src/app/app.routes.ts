import { Routes } from '@angular/router';
import { PokemonInfoComponent } from './pages/pokemon-info/pokemon-info.component';
import { PokemonsHome } from './pages/home-page/pokemons-home.component';
import { FavoritPokemonsComponent } from './pages/favorit-pokemons.component/favorit-pokemons.component';
import { ArenaComponent } from './pages/areana/arena /arena.component';
import { ArenaSelectComponent } from './component/select-pekemon/select-pekemon.component';
import { ArenaFightComponent } from './component/fight/fight.component';

export const routes: Routes = [
  { path: 'home', component: PokemonsHome },
  { path: 'pokemon-info/:id', component: PokemonInfoComponent },
  { path: 'favorite-pokemons', component: FavoritPokemonsComponent },
  { path: 'areana', component: ArenaComponent },
  { path: 'arena/select', component: ArenaSelectComponent },
  { path: 'arena/fight', component: ArenaFightComponent },
];
