import { Routes } from '@angular/router';
import { AppHomeComponent } from './app-home-component/app-home-component';

export const routes: Routes = [
  // Home is now your login page
  { path: '', component: AppHomeComponent, title: 'Home' },

  { path: 'auth',   loadChildren: () => import('./core/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  { path: 'portal', loadChildren: () => import('./features/portal/routes/portal.routes').then(m => m.PORTAL_ROUTES) },

  // locationId belongs on parent
  { path: 'location/:locationId',
    loadChildren: () => import('./features/location/location.routes').then(m => m.LOCATION_ROUTES)
  },

  // fallback — unknown URLs bounce home
  { path: '**', redirectTo: '' },
];
