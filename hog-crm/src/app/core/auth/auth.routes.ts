import { Routes } from '@angular/router';
import { alreadyAuthedGuard } from './already-authed-guard';

export const AUTH_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canActivate: [alreadyAuthedGuard],
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
    title: 'Sign In',
  },
  {
    path: 'logout',
    loadComponent: () => import('./logout.page').then(m => m.LogoutPage),
    title: 'Signing out…',
  },
  { path: '**', redirectTo: 'login' },
];
