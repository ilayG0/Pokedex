import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('../app/component/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
 {
    path: '',
    loadChildren: () =>
      import('./pokedex.routes').then((m) => m.POKEDEX_ROUTES),
  },
  { path: '**', redirectTo: 'auth/login' },
];
