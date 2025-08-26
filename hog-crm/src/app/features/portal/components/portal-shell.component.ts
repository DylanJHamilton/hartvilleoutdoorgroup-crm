import { Component } from '@angular/core';
import { AppShellComponent } from '../../../shared/layout/app-shell/app-shell.component';
import { NavItem } from '../../../shared/shared.types';

@Component({
  standalone: true,
  selector: 'hog-portal-shell',
  imports: [AppShellComponent],
  template: `
    <hog-app-shell
      [brand]="'HOG Portal'"
      [subtitle]="'Material Admin'"
      [title]="'Hartville Outdoor Group — Portal'"
      [nav]="nav">
    </hog-app-shell>
  `
})
export class PortalShellComponent {
  nav: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',   link: ['dashboard'] },
    { label: 'Reports',    icon: 'analytics',   link: ['reports'] },
    { label: 'Stores',     icon: 'store',       link: ['stores'] },
    { label: 'Users',      icon: 'group',       link: ['users'] },
    { label: 'Inventory',  icon: 'inventory_2', link: ['inventory'] },
    { label: 'Scheduling', icon: 'event',       link: ['scheduling'] },
  ];
}
