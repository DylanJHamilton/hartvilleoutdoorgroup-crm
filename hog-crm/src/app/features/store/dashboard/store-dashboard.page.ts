// src/app/features/store/dashboard/store-dashboard.page.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/auth/auth.service';


// Import the concrete dashboard component TYPES
import { DashAdminPage } from './dashboards/dash-admin.page';
import { DashManagerPage } from './dashboards/dash-manager.page';
import { DashSalesPage } from './dashboards/dash-sales.page';
import { DashServicePage } from './dashboards/dash-service.page';
import { DashDeliveryPage } from './dashboards/dash-delivery.page';
import { DashInventoryPage } from './dashboards/dash-inventory.page';
import { DashCsPage } from './dashboards/dash-cs.page';

type Role =
  | 'ADMIN'
  | 'MANAGER'
  | 'SALES'
  | 'SERVICE'
  | 'DELIVERY'
  | 'INVENTORY'
  | 'CS';

  
@Component({
  standalone: true,
  selector: 'hog-store-dashboard',
  imports: [CommonModule, NgComponentOutlet],
  template: `
    <ng-container *ngIf="role() as r">
      <ng-container *ngIf="r === 'ADMIN'">
        <ng-container *ngComponentOutlet="DashAdmin"></ng-container>
      </ng-container>

      <ng-container *ngIf="r === 'MANAGER'">
        <ng-container *ngComponentOutlet="DashManager"></ng-container>
      </ng-container>

      <ng-container *ngIf="r === 'SALES'">
        <ng-container *ngComponentOutlet="DashSales"></ng-container>
      </ng-container>

      <ng-container *ngIf="r === 'SERVICE'">
        <ng-container *ngComponentOutlet="DashService"></ng-container>
      </ng-container>

      <ng-container *ngIf="r === 'DELIVERY'">
        <ng-container *ngComponentOutlet="DashDelivery"></ng-container>
      </ng-container>

      <ng-container *ngIf="r === 'INVENTORY'">
        <ng-container *ngComponentOutlet="DashInventory"></ng-container>
      </ng-container>

      <ng-container *ngIf="r === 'CS'">
        <ng-container *ngComponentOutlet="DashCs"></ng-container>
      </ng-container>
    </ng-container>
  `
})
export class StoreDashboardPage {
  private store = inject(Store);
  // inside class:
  private auth = inject(AuthService);

  /**
   * Reads roles from state.auth.roles if present; otherwise undefined.
   * This avoids importing a selector you don't have yet.
   */
  private rolesSignal = this.store.selectSignal((state: any) => state?.auth?.roles as string[] | undefined);

  /**
   * First role wins; normalize to our Role union, fallback to ADMIN.
   */
    // replace your previous role computed with:
  role = computed<Role>(() => {
    const r = (this.auth.getRole() || 'ADMIN').toUpperCase();
    return (['ADMIN','MANAGER','SALES','SERVICE','DELIVERY','INVENTORY','CS'].includes(r) ? r as Role : 'ADMIN');
  });

  // Component TYPES for ngComponentOutlet (do NOT use lazy functions here)
  DashAdmin = DashAdminPage;
  DashManager = DashManagerPage;
  DashSales = DashSalesPage;
  DashService = DashServicePage;
  DashDelivery = DashDeliveryPage;
  DashInventory = DashInventoryPage;
  DashCs = DashCsPage;
}
