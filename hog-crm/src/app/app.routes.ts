import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('./core/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  { path: 'portal', loadChildren: () => import('./features/portal/routes/portal.routes').then(m => m.PORTAL_ROUTES) },
  // (later) { path: 'store', loadChildren: () => import('./features/store/store.routes').then(m => m.STORE_ROUTES) },
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: '**', redirectTo: 'auth/login' }
];
