import { Routes } from '@angular/router';
import { AppHomeComponent } from './app-home-component/app-home-component';

export const routes: Routes = [
  {
    path: '',
    component: AppHomeComponent,
  },

  // Alias so /#/auth/login also works while we stabilize
  {
    path: 'auth',
    children: [
      { path: 'login', redirectTo: '/login', pathMatch: 'full' }, // absolute to top-level /login
    ],
  },

  { path: '**', redirectTo: '' },
];
