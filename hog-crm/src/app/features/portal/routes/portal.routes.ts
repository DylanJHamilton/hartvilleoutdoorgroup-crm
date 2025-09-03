// src/app/features/portal/routes/portal.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../../../core/auth/auth.guard';
import { portalAccessGuard } from '../facade/portal-access.guard';
import { PortalShellComponent } from '../components/portal-shell/portal-shell.component';
import { usersAccessGuard } from '../users/users-access.guard';

// NOTE: Remove or fix this if you actually need it.
// If you need the type, uncomment and point to the right file:
// import type { PortalReport } from '../types/portal.types';

export const PORTAL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, portalAccessGuard],
    component: PortalShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../dashboard/portal-dashboard.page').then(m => m.PortalDashboardPage),
        title: 'Portal Dashboard',
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('../reports/reports.page').then(m => m.ReportsPage),
        title: 'Reports',
      },
      {
        path: 'stores', // <- was '../store/stores.page' in your import string
        loadComponent: () =>
          import('../store/stores.page').then(m => m.StoresPage),
        title: 'Stores',
      },
      {
        path: 'users',
        canActivate: [usersAccessGuard],
        loadComponent: () =>
          import('../users/users.page').then(m => m.UsersPage),
        title: 'Users',
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('../inventory/inventory.page').then(m => m.InventoryPage),
        title: 'Inventory',
      },
      {
        path: 'scheduling',
        loadComponent: () =>
          import('../scheduling/scheduling.page').then(m => m.SchedulingPage),
        title: 'Scheduling',
      },
      {
        path: 'settings',
        loadComponent: () => 
          import('../components/user-settings/user-settings').then(m => m.UserSettingsComponent),
        title: 'User Settings',
      },
      {
        path: 'unauthorized',
        loadComponent: () => import('../components/unauthorized.page').then(m => m.UnauthorizedPage),
        title: 'Unauthorized',
      }
    ],
  },
];
