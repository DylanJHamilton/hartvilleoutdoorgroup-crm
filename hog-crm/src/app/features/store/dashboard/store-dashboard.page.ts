import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextService } from '../../../core/context/context.service';

@Component({
  standalone: true,
  selector: 'hog-store-dashboard',
  imports: [CommonModule],
  template: `
    <!-- Priority: OWNER/ADMIN > MANAGER > SALES > SERVICE > DELIVERY > INVENTORY > CS -->
    <ng-container [ngSwitch]="role">
      <ng-container *ngSwitchCase="'ADMIN'">
        <ng-container *ngComponentOutlet="dashAdmin"></ng-container>
      </ng-container>
      <ng-container *ngSwitchCase="'OWNER'">
        <ng-container *ngComponentOutlet="dashAdmin"></ng-container>
      </ng-container>
      <ng-container *ngSwitchCase="'MANAGER'">
        <ng-container *ngComponentOutlet="dashManager"></ng-container>
      </ng-container>
      <ng-container *ngSwitchCase="'SALES'">
        <ng-container *ngComponentOutlet="dashSales"></ng-container>
      </ng-container>
      <ng-container *ngSwitchCase="'SERVICE'">
        <ng-container *ngComponentOutlet="dashService"></ng-container>
      </ng-container>
      <ng-container *ngSwitchCase="'DELIVERY'">
        <ng-container *ngComponentOutlet="dashDelivery"></ng-container>
      </ng-container>
      <ng-container *ngSwitchCase="'INVENTORY'">
        <ng-container *ngComponentOutlet="dashInventory"></ng-container>
      </ng-container>
      <ng-container *ngSwitchDefault>
        <ng-container *ngComponentOutlet="dashCs"></ng-container>
      </ng-container>
    </ng-container>
  `
})
export class StoreDashboardPage {
  private ctx = inject(ContextService);

  // pick highest-priority role
  get role(): string {
    const r = this.ctx.roles();
    const order = ['OWNER','ADMIN','MANAGER','SALES','SERVICE','DELIVERY','INVENTORY','CS'];
    return order.find(x => r.includes(x as any)) ?? 'CS';
  }

  // lazy component references (imported dynamically)
  dashAdmin    = () => import('./dashboards/dash-admin.page').then(m => m.DashAdminPage);
  dashManager  = () => import('./dashboards/dash-manager.page').then(m => m.DashManagerPage);
  dashSales    = () => import('./dashboards/dash-sales.page').then(m => m.DashSalesPage);
  dashService  = () => import('./dashboards/dash-service.page').then(m => m.DashServicePage);
  dashDelivery = () => import('./dashboards/dash-delivery.page').then(m => m.DashDeliveryPage);
  dashInventory= () => import('./dashboards/dash-inventory.page').then(m => m.DashInventoryPage);
  dashCs       = () => import('./dashboards/dash-cs.page').then(m => m.DashCsPage);
}
