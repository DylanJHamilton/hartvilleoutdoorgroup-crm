// src/app/features/store/dashboard/store-dashboard.page.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import type { User } from '../../../types/user.types';
import type { Role } from '../../../types/role.types';

// Use your existing role utilities
import {
  rolesForLocation,
  isPrivilegedGlobal,
} from '../../../core/auth/roles.util';

// Dashboards
import { DashAdminPage }     from './dashboards/admin/dash-admin.page';
import { DashManagerPage }   from './dashboards/manager/dash-manager.page';
import { DashSalesPage }     from './dashboards/sales/dash-sales.page';
import { DashServicePage }   from './dashboards/service/dash-service.page';
import { DashDeliveryPage }  from './dashboards/delivery/dash-delivery.page';
import { DashInventoryPage } from './dashboards/inventory/dash-inventory.page';
import { DashCsPage }        from './dashboards/customer-service/dash-cs.page';

type RoleKey = Extract<Role,
  'OWNER'|'ADMIN'|'MANAGER'|'SALES'|'SERVICE'|'DELIVERY'|'INVENTORY'|'CS'|'SUPPORT'
>;

@Component({
  standalone: true,
  selector: 'hog-location-dashboard',
  imports: [CommonModule, NgComponentOutlet],
  template: `
    <ng-container *ngIf="dashComponent() as C">
      <ng-container *ngComponentOutlet="C"></ng-container>
    </ng-container>
    <!-- Optional debug:
    <div style="position:fixed;right:12px;bottom:12px;padding:6px 8px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#64748b;font-size:12px">
      role: {{ effectiveRole() }} • store: {{ storeId() }}
    </div>
    -->
  `
})
export class LocationDashboardPage {
  private auth  = inject(AuthService);
  private route = inject(ActivatedRoute);

  // URL context
  storeId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  // Current user (works with either auth.user() signal or .currentUser)
  private user = computed<User | null>(() => {
    const a: any = this.auth;
    return typeof a.user === 'function' ? a.user() : a.currentUser ?? null;
  });

  // Normalize role strings (map SUPPORT → CS so both hit the CS dashboard)
  private normalizeRole(r: string | null | undefined): Exclude<RoleKey, 'SUPPORT'> | null {
    if (!r) return null;
    const up = r.toUpperCase() as RoleKey;
    if (up === 'SUPPORT') return 'CS';
    const allowed: Exclude<RoleKey, 'SUPPORT'>[] = ['OWNER','ADMIN','MANAGER','SALES','SERVICE','DELIVERY','INVENTORY','CS'];
    return allowed.includes(up as any) ? (up as any) : null;
  }

  // Effective role for this store (uses your rolesForLocation union logic)
  effectiveRole = computed<Exclude<RoleKey, 'SUPPORT'>>(() => {
    const u = this.user();
    const id = this.storeId();
    const all = rolesForLocation(u, id) // already union of global + per-location roles
      .map(r => this.normalizeRole(r))
      .filter((x): x is Exclude<RoleKey, 'SUPPORT'> => !!x);

    const priority: Exclude<RoleKey, 'SUPPORT'>[] =
      ['OWNER','ADMIN','MANAGER','SALES','SERVICE','DELIVERY','INVENTORY','CS'];

    const found = priority.find(p => all.includes(p));
    if (found) return found;

    // Safe final fallback: privileged users → ADMIN, otherwise CS
    return isPrivilegedGlobal(u) ? 'ADMIN' : 'CS';
  });

  // Component mapping
  dashComponent = computed<any>(() => {
    switch (this.effectiveRole()) {
      case 'OWNER':
      case 'ADMIN':     return DashAdminPage;
      case 'MANAGER':   return DashManagerPage;
      case 'SALES':     return DashSalesPage;
      case 'SERVICE':   return DashServicePage;
      case 'DELIVERY':  return DashDeliveryPage;
      case 'INVENTORY': return DashInventoryPage;
      case 'CS':        return DashCsPage;
      default:          return DashCsPage;
    }
  });
}
