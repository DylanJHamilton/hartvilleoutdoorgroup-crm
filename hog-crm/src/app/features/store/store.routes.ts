import { Routes } from '@angular/router';
import { storeAccessGuard } from './store-access.guard';
import { storeResolver } from './store.resolver';
import { StoreShellComponent } from './components/store-shell.component';

export const STORE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [storeAccessGuard],
    resolve: { ok: storeResolver },
    component: StoreShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/store-dashboard.page').then(m => m.StoreDashboardPage),
        title: 'Store Dashboard'
      },
      { path: 'sales',      loadComponent: () => import('./sales/sales.page').then(m => m.SalesPage), title: 'Sales' },
      { path: 'inventory',  loadComponent: () => import('./inventory/inventory.page').then(m => m.InventoryPage), title: 'Inventory' },
      { path: 'service',    loadComponent: () => import('./service/service.page').then(m => m.ServicePage), title: 'Service' },
      { path: 'delivery',   loadComponent: () => import('./delivery/delivery.page').then(m => m.DeliveryPage), title: 'Delivery' },
      { path: 'rentals',    loadComponent: () => import('./rentals/rentals.page').then(m => m.RentalsPage), title: 'Rentals' },
      { path: 'support',    loadComponent: () => import('./support/support.page').then(m => m.SupportPage), title: 'Support' },
      { path: 'reports',    loadComponent: () => import('./reports/reports.page').then(m => m.ReportsPage), title: 'Reports' },
      { path: 'settings',   loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage), title: 'Settings' },
    ]
  }
];
