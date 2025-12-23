// auth.routes.ts
import { Routes } from '@angular/router';
import { AuthShellComponent } from './auth-shell/auth-shell.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { guestGuard } from '../../services/guest.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthShellComponent,
    canActivate: [guestGuard],     
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
];
