import { Component, inject } from '@angular/core';
import { AppShellComponent } from '../../../shared/layout/app-shell/app-shell.component';
import { ContextService } from '../../../core/context/context.service';
import { NavItem } from '../../../shared/shared.types';


@Component({
  standalone: true,
  selector: 'hog-store-shell',
  imports: [AppShellComponent],
  template: `
    <hog-app-shell
      [brand]="activeStoreName"
      [subtitle]="'Store Operations'"
      [title]="'Hartville Outdoor Group — Store'"
      [nav]="nav">
    </hog-app-shell>
  `
})
export class StoreShellComponent {
  private ctx = inject(ContextService);
  activeStoreName = this.ctx.activeStore()?.name ?? 'Store';
  nav: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',   link: ['dashboard'] },
    { label: 'Sales',      icon: 'sell',        link: ['sales'] },
    { label: 'Inventory',  icon: 'inventory_2', link: ['inventory'] },
    { label: 'Service',    icon: 'build',       link: ['service'] },
    { label: 'Delivery',   icon: 'local_shipping', link: ['delivery'] },
    { label: 'Rentals',    icon: 'two_wheeler', link: ['rentals'] },
    { label: 'Support',    icon: 'support_agent', link: ['support'] },
    { label: 'Reports',    icon: 'analytics',   link: ['reports'] },
    { label: 'Settings',   icon: 'settings',    link: ['settings'] },
  ];
}
