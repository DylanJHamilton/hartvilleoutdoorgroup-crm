// src/app/features/portal/dashboard/portal-dashboard.page.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { mockStores, type LocationRef } from '../../../mock/locations.mock';
import { AuthService } from '../../../core/auth/auth.service';
import type { User } from '../../../types/user.types';
import type { Role } from '../../../types/role.types';
import {
  isPrivilegedGlobal,
  userLocationIds,
  rolesForLocation,
  canSeeAllLocations,       // 👈 import the new helper
} from '../../../core/auth/roles.util';

type NavItem = { path: string; label: string };

const NAV_BY_ROLE: Record<Role | 'MANAGER_SET', NavItem[]> = {
  OWNER: [], ADMIN: [], MANAGER: [],
  SALES: [
    { path: 'sales',           label: 'Sales' },
    { path: 'sales/pipeline',  label: 'Pipeline' },
    { path: 'sales/deals',     label: 'Deals' },
    { path: 'sales/documents', label: 'Documents' },
    { path: 'customers',       label: 'Customers' },
    { path: 'settings',        label: 'Settings' },
  ],
  SUPPORT: [
    { path: 'support',   label: 'Support Tickets' },
    { path: 'customers', label: 'Customers' },
    { path: 'settings',  label: 'Settings' },
  ],
  CS: [
    { path: 'support',   label: 'Support Tickets' },
    { path: 'customers', label: 'Customers' },
    { path: 'settings',  label: 'Settings' },
  ],
  SERVICE: [
    { path: 'service',   label: 'Service' },
    { path: 'customers', label: 'Customers' },
    { path: 'settings',  label: 'Settings' },
  ],
  RENTALS: [
    { path: 'rentals',   label: 'Rentals' },
    { path: 'customers', label: 'Customers' },
    { path: 'settings',  label: 'Settings' },
  ],
  DELIVERY: [
    { path: 'delivery',  label: 'Deliveries' },
    { path: 'customers', label: 'Customers' },
    { path: 'settings',  label: 'Settings' },
  ],
  INVENTORY: [
    { path: 'inventory', label: 'Inventory' },
    { path: 'customers', label: 'Customers' },
    { path: 'settings',  label: 'Settings' },
  ],
  MANAGER_SET: [
    { path: 'dashboard', label: 'Dashboard' },
    { path: 'sales',     label: 'Sales' },
    { path: 'customers', label: 'Customers' },
    { path: 'inventory', label: 'Inventory' },
    { path: 'reports',   label: 'Performance' },
    { path: 'settings',  label: 'Settings' },
  ],
};

function allowedPagesForRoles(effective: Role[]): NavItem[] {
  const privileged = effective.some(r => r === 'OWNER' || r === 'ADMIN' || r === 'MANAGER');
  if (privileged) return NAV_BY_ROLE.MANAGER_SET;
  const map = new Map<string, NavItem>();
  effective.forEach(r => (NAV_BY_ROLE[r] ?? []).forEach(item => map.set(item.path, item)));
  if (map.size === 0) [
    { path: 'customers', label: 'Customers' },
    { path: 'settings',  label: 'Settings' }
  ].forEach(i => map.set(i.path, i));
  return Array.from(map.values());
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="grid">
      <div class="card kpi"><h3>Total Leads</h3><div class="num">382</div></div>
      <div class="card kpi"><h3>Open Quotes</h3><div class="num">146</div></div>
      <div class="card kpi"><h3>Orders in Progress</h3><div class="num">39</div></div>
      <div class="card kpi"><h3>MTD Revenue</h3><div class="num">$182,400</div></div>

      <div class="card full">
        <h3>{{ title() }}</h3>
        <div class="locs">
          <div class="loc-card" *ngFor="let loc of locations()">
            <div class="loc-head">
              <div class="loc-name">{{ loc.name }}</div>
              <a class="go" [routerLink]="'/location/' + loc.id + '/dashboard'">Open →</a>
            </div>

            <div class="roles">
              <span class="chip" *ngFor="let r of rolesAt(loc.id)">{{ r }}</span>
            </div>

            <div class="pages">
              <a *ngFor="let item of pagesAt(loc.id)"
                 class="page-link"
                 [routerLink]="'/location/' + loc.id + '/' + item.path">
                {{ item.label }}
              </a>
            </div>
          </div>
        </div>

        <small *ngIf="!seeAll()" class="hint">
          You’re viewing your assigned locations only.
        </small>
      </div>
    </section>
  `,
  styles: [`
    .grid{display:grid;gap:16px;grid-template-columns:repeat(12,1fr)}
    .card{background:#fff;border-radius:12px;padding:16px;box-shadow:0 6px 24px rgba(15,23,42,.06)}
    .kpi{grid-column:span 3}.num{font-size:28px;font-weight:700;margin-top:6px}
    .full{grid-column:1/-1}
    .locs{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));margin-top:8px}
    .loc-card{border:1px solid #e5e7eb;border-radius:12px;padding:12px}
    .loc-head{display:flex;align-items:center;gap:8px}
    .loc-name{font-weight:700;flex:1}
    .go{text-decoration:none;color:#3f51b5}
    .roles{margin:8px 0;display:flex;gap:6px;flex-wrap:wrap}
    .chip{background:#eef2ff;color:#3730a3;border-radius:999px;padding:2px 8px;font-size:12px}
    .pages{display:flex;flex-wrap:wrap;gap:8px}
    .page-link{display:inline-block;padding:6px 10px;background:#f1f5f9;border-radius:10px;text-decoration:none;color:#0f172a}
    .page-link:hover{background:#e2e8f0}
    .hint{display:block;margin-top:8px;color:#64748b}
  `]
})
export class PortalDashboardPage {
  private auth = inject(AuthService);

  private user(): User | null {
    return typeof (this.auth as any).user === 'function'
      ? (this.auth as any).user()
      : (this.auth as any).getUser?.() ?? (this.auth as any).currentUser ?? null;
  }

  readonly isPrivileged = computed(() => isPrivilegedGlobal(this.user()));
  readonly seeAll       = computed(() => canSeeAllLocations(this.user())); // 👈 OWNER/ADMIN only

  // Locations to display
  readonly locations = computed<LocationRef[]>(() => {
    const all = mockStores;
    if (this.seeAll()) return all;                 // only OWNER/ADMIN see all
    const allowed = new Set(userLocationIds(this.user()));
    return all.filter(l => allowed.has(l.id));     // MANAGER/hybrids scoped
  });

  readonly title = computed(() => this.seeAll() ? 'All Locations' : 'Your Locations');

  // Effective roles at a location + derived pages
  rolesAt = (id: string): Role[] => rolesForLocation(this.user(), id);
  pagesAt = (id: string): NavItem[] => allowedPagesForRoles(this.rolesAt(id));
}
