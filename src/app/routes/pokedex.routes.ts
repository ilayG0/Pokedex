// pokedex.routes.ts
import { Routes } from '@angular/router';
import { PokedexShellComponent } from '../../app/pages/home-main-app/home-main-app.component';
import { PokemonsHome } from '../pages/home-page/pokemons-home.component';
import { PokemonInfoComponent } from '../pages/pokemon-info/pokemon-info.component';
import { FavoritPokemonsComponent } from '../pages/favorit-pokemons.component/favorit-pokemons.component';
import { ArenaComponent } from '../pages/areana/arena /arena.component';
import { ArenaSelectComponent } from '../component/select-pekemon/select-pekemon.component';
import { ArenaFightComponent } from '../component/fight/fight.component';
import { authGuard } from '../../app/services/auth.guard';

export const POKEDEX_ROUTES: Routes = [
  {
    path: '',
    component: PokedexShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: PokemonsHome },           
      { path: 'pokemon-info/:id', component: PokemonInfoComponent },
      { path: 'favorite-pokemons', component: FavoritPokemonsComponent },
      { path: 'areana', component: ArenaComponent },
      { path: 'arena/select', component: ArenaSelectComponent },
      { path: 'arena/fight', component: ArenaFightComponent },

      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },
];
