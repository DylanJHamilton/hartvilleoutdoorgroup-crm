import { Routes } from '@angular/router';
import { alreadyAuthedGuard } from '../auth/already-authed-guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [alreadyAuthedGuard],
    loadComponent: () => import('./login.page').then(m => m.LoginPage),
    title: 'Sign In'
  },
  {
    path: 'logout',
    loadComponent: () => import('./logout.page').then(m => m.LogoutPage),
    title: 'Signing out...'
  },
  { path: '**', redirectTo: 'login' }
];
