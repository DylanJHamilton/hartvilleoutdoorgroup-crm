import { Routes } from '@angular/router';
import { locationAccessGuard } from './location-access.guard';
import { locationResolver } from './location.resolver';
import { LocationShellComponent } from './components/location-shell.component';
import { LocationDashboardPage } from './dashboard/location-dashboard.page';
import { authGuard } from '../../core/auth/auth.guard';
import { SalesSettingsGuard } from './sales/settings/sales-settings.guard';

export const LOCATION_ROUTES: Routes = [
  {
    path: '',
    canActivate: [locationAccessGuard],
    resolve: { ok: locationResolver },
    component: LocationShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      // EAGER dashboard
      { path: 'dashboard', component: LocationDashboardPage, title: 'Location Dashboard' },

      // Sales hub with children
      {
        path: 'sales',
        loadComponent: () => import('./sales/sales.page').then(m => m.SalesPage),
        title: 'Sales',
        children: [
          {
            path: 'pipeline',
            loadComponent: () =>
              import('./sales/pipeline/sales-pipeline-page').then(m => m.SalesPipelinePage),
            title: 'Sales Pipeline',
          },
          {
            path: 'leads',
            loadComponent: () =>
              import('./sales/leads/leads-page').then(m => m.LeadsPage),
            title: 'Leads',
          },
          {
            path: 'opportunities',
            loadComponent: () =>
              import('./sales/opportunities/opportunities-page').then(m => m.OpportunitiesPage),
            title: 'Opportunities',
          },
          {
            path: 'appointments',
            loadComponent: () =>
              import('./sales/appointments/appointments-page').then(m => m.AppointmentsPage),
          },
          {
            path: 'quote',
            loadComponent: () =>
              import('./sales/quote/quote-page').then(m => m.QuotesPage)
          },
          {
            path: 'quote/:id',
            loadComponent: () =>
              import('./sales/quote/detail/quote-detail-page').then(m => m.QuoteDetailPage),
            title: 'Quote Detail'
          },
          {
            path: 'quote/promotions',
            loadComponent: () =>
              import('./sales/quote/promotions/promotions-page').then(m => m.PromotionsPage),
            title: 'Promotions'
          },
          {
            path: 'reports',
            loadComponent: () =>
              import('./sales/reports/sales-reports-page').then(m => m.SalesReportsPage),
          },
          {
            path: 'settings',
            data: { roles: ['OWNER', 'ADMIN', 'MANAGER'] },
            canActivate: [SalesSettingsGuard],
            loadComponent: () =>
              import('./sales/settings/sales-settings').then(m => m.SalesSettingsComponent),
          },
          // Add more children later: deals, documents, performance, prospecting, tasks
        ],
      },

      // Customers (nested)
      {
        path: 'customers',
        children: [
          { path: '', loadComponent: () => import('./customers/customers.page').then(m => m.CustomersPage), title: 'Customers' },
          { path: 'dashboard', loadComponent: () => import('./customers/dashboard/customer-dashboard.page').then(m => m.CustomersDashboardPage), title: 'Customers Dashboard' },
          { path: 'conversations', loadComponent: () => import('./customers/conversations/customer-conversations.page').then(m => m.CustomersConversationsPage), title: 'Conversations' },
          { path: ':id', loadComponent: () => import('./customers/customer-detail/customer-detail.page').then(m => m.CustomerDetailPage), title: 'Customer' },
        ]
      },

      // Inventory/Service/etc
      { path: 'inventory', loadComponent: () => import('./inventory/inventory.page').then(m => m.InventoryPage), title: 'Inventory' },
      { path: 'service',   loadComponent: () => import('./service/service.page').then(m => m.ServicePage),       title: 'Service' },
      { path: 'delivery',  loadComponent: () => import('./delivery/delivery.page').then(m => m.DeliveryPage),    title: 'Delivery' },
      { path: 'rentals',   loadComponent: () => import('./rentals/rentals.page').then(m => m.RentalsPage),       title: 'Rentals' },

      // 🔹 Support as a group (Dashboard + Tickets + Ticket Detail)
      {
        path: 'support',
        title: 'Support',
        children: [
          {
            path: '',
            loadComponent: () => import('./support/support.page').then(m => m.SupportPage),
            title: 'Support Dashboard'
          },
          {
            path: 'tickets',
            loadComponent: () => import('./support/tickets/support-tickets.page').then(m => m.SupportTicketsPage),
            title: 'Support Tickets'
          },
          {
            path: 'tickets/:id',
            loadComponent: () => import('./support/tickets/support-tickets.page').then(m => m.SupportTicketsPage),
            title: 'Ticket'
          }
        ]
      },

      { path: 'reports',   loadComponent: () => import('./reports/reports.page').then(m => m.ReportsPage),       title: 'Reports' },
      { path: 'settings',  loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage),    title: 'Settings' },
    ],
  },
];
