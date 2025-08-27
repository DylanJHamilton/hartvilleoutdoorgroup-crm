import { Routes } from '@angular/router';

export const routes: Routes = [
  // Default → Login
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  // Auth area (login/forgot/etc.)
  {
    path: 'auth',
    loadChildren: () =>
      import('./core/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  // App portal (dashboards, features)
  {
    path: 'portal',
    loadChildren: () =>
      import('./features/portal/routes/portal.routes').then(m => m.PORTAL_ROUTES),
  },

    // App portal (dashboards, features)
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/store/store.routes').then(m => m.STORE_ROUTES),
  },

  // Fallback → Login
  { path: '**', redirectTo: 'auth/login' },
];
