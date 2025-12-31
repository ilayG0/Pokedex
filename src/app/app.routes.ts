import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./routes/auth.routes').then((m) => m.AUTH_ROUTES),
  },
 {
    path: '',
    loadChildren: () =>
      import('./routes/pokedex.routes').then((m) => m.POKEDEX_ROUTES),
  },
  { path: '**', redirectTo: 'auth/login' },
];
