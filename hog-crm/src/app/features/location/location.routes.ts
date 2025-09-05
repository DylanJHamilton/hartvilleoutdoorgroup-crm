import { Routes } from '@angular/router';
import { locationAccessGuard } from './location-access.guard';
import { locationResolver } from './location.resolver';
import { LocationShellComponent } from './components/location-shell.component';
import { LocationDashboardPage } from './dashboard/location-dashboard.page';

export const LOCATION_ROUTES: Routes = [
  {
    path: '',
    canActivate: [locationAccessGuard],
    resolve: { ok: locationResolver },
    component: LocationShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      // EAGER for now to eliminate lazy-chunk issues
      { path: 'dashboard', component: LocationDashboardPage, title: 'Location Dashboard' },

      { path: 'sales',     loadComponent: () => import('./sales/sales.page').then(m => m.SalesPage),           title: 'Sales' },
      { path: 'inventory', loadComponent: () => import('./inventory/inventory.page').then(m => m.InventoryPage), title: 'Inventory' },
      { path: 'service',   loadComponent: () => import('./service/service.page').then(m => m.ServicePage),       title: 'Service' },
      { path: 'delivery',  loadComponent: () => import('./delivery/delivery.page').then(m => m.DeliveryPage),    title: 'Delivery' },
      { path: 'rentals',   loadComponent: () => import('./rentals/rentals.page').then(m => m.RentalsPage),       title: 'Rentals' },
      { path: 'support',   loadComponent: () => import('./support/support.page').then(m => m.SupportPage),       title: 'Support' },
      { path: 'reports',   loadComponent: () => import('./reports/reports.page').then(m => m.ReportsPage),       title: 'Reports' },
      { path: 'settings',  loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage),    title: 'Settings' },
    ],
  },
];
