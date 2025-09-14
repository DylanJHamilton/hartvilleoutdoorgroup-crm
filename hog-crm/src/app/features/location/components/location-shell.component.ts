import { Component, computed, inject, ViewEncapsulation, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, ActivatedRouteSnapshot } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, map } from 'rxjs/operators';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule }    from '@angular/material/icon';
import { MatButtonModule }  from '@angular/material/button';
import { MatMenuModule }    from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { SideNavComponent } from '../../../shared/layout/side-nav/side-nav.component';
import { NavItem } from '../../../shared/shared.types';

import { AuthService } from '../../../core/auth/auth.service';
import { rolesForLocation, isOwnerOrAdminUser } from '../../../core/auth/roles.util';

const ORG_NAME = 'Hartville Outdoor Group';
const LOCATION_NAME_BY_ID: Record<string, string> = { s1: 'Hartville', s2: 'Medina', s3: 'Mentor' };

/** Extract ':id' from '/location/:id/...'. */
function storeIdFromUrl(url: string): string | undefined {
  const segs = url.split('?')[0].split('/').filter(Boolean);
  const i = segs.indexOf('location');
  return i >= 0 && segs[i + 1] ? segs[i + 1].toLowerCase() : undefined;
}

/** Walk to the deepest child and return the last defined RouteConfig.title (not data.title). */
function routeTitle(root: ActivatedRouteSnapshot | null | undefined): string | undefined {
  let node = root ?? null;
  let last: string | undefined;
  while (node) {
    const t = node.routeConfig?.title as string | undefined;
    if (t) last = t;
    node = node.firstChild ?? null;
  }
  return last;
}

/** Normalize common variants e.g. "Location Dashboard" -> "Dashboard". */
function normalizeTitle(t: string): string {
  return (t || '').replace(/^location\s+/i, '').trim() || 'Dashboard';
}

@Component({
  standalone: true,
  selector: 'hog-store-shell',
  imports: [
    CommonModule, RouterOutlet, RouterLink,
    SideNavComponent,
    MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule
  ],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'hog-portal-light location-scope' },
  styleUrls: ['location-shell.component.scss'],
  templateUrl : 'location-shell.component.html',
})
export class LocationShellComponent {
  private router = inject(Router);
  private auth   = inject(AuthService);

  // left rail state
  navOpen = signal(true);
  toggleNav() { this.navOpen.set(!this.navOpen()); }

  // Reactive storeId from URL (updates on every navigation)
  private readonly urlStoreId = toSignal(
    this.router.events.pipe(startWith(0), map(() => storeIdFromUrl(this.router.url))),
    { initialValue: storeIdFromUrl(this.router.url) }
  );

  /** 's1' | 's2' | 's3' (default 's1' if missing) */
  readonly locationId = computed<'s1'|'s2'|'s3'|string>(() => this.urlStoreId() || 's1');

  /** Friendly store name */
  readonly locationShort = computed(() => LOCATION_NAME_BY_ID[this.locationId()] ?? 'Location');

  // === SideNav header lines ===
  orgBrand      = computed(() => ORG_NAME);
  storeSubtitle = computed(() => `${this.locationShort()} (Location)`);

  // Blue bar title
  pageTitle = toSignal(
    this.router.events.pipe(
      startWith(0),
      map(() => normalizeTitle(routeTitle(this.router.routerState.snapshot.root) || 'Dashboard'))
    ),
    { initialValue: normalizeTitle(routeTitle(this.router.routerState.snapshot.root) || 'Dashboard') }
  );

  // User display and actions
  userName = computed(() => {
    const u = this.auth.getUser() as any;
    const first = u?.firstName ?? u?.first_name ?? u?.given_name ?? '';
    const last  = u?.lastName  ?? u?.last_name  ?? u?.family_name ?? '';
    const full  = `${(first || '').trim()} ${(last || '').trim()}`.trim();
    return full || u?.name || 'User';
  });

  /** Link to User Settings page (location-scoped). */
  settingsLink = computed<any[]>(() => ['/location', this.locationId(), 'settings']);

  signOut() { try { (this.auth as any)?.signOut?.(); } catch {} this.router.navigateByUrl('/auth/login'); }

  // ---- role-aware nav
  private readonly user         = computed(() => this.auth.getUser() ?? null);
  private readonly isAdminOwner = computed(() => !!this.user() && isOwnerOrAdminUser(this.user()!));
  private readonly roles        = computed<Set<string>>(() => {
    const rs = this.user() ? rolesForLocation(this.user()!, this.locationId()) ?? [] : [];
    return new Set(rs.map(r => String(r).toUpperCase()));
  });

  /** Shared Sales entries (used as group children for mgrs, and flattened for reps) */
  private salesChildren(): any[] {
    return [
      { id:'dash',           label:'Sales Dashboard',           icon:'dashboard',      link:['dashboard'] },
      { id:'sales-leads',    label:'Leads',                     icon:'person_add',     link:['sales','leads'] },
      { id:'sales-pipeline', label:'Pipeline',                  icon:'account_tree',   link:['sales','pipeline'] },
      { id:'sales-opps',     label:'Prospect Opportunities',    icon:'lightbulb',      link:['sales','opportunities'] },
      { id:'sales-cal',      label:'Appointments & Events',     icon:'event',          link:['sales','appointments'] },
      { id:'sales-quote',    label:'Quote Builder',             icon:'request_quote',  link:['sales','quote'] },
      { id:'sales-reports',  label:'Reports & My Performance',  icon:'analytics',      link:['sales','reports'] },
    ];
  }

  /** Customers group with child entries */
  private customersGroup() {
    return {
      id: 'customers',
      label: 'Customers',
      icon: 'groups',
      children: [
        { id:'cust-dash', label:'Dashboard', icon:'insights', link:['customers','dashboard'] },
        { id:'cust-list', label:'List',      icon:'list',     link:['customers'] },
        { id:'cust-conv', label:'Conversations', icon:'forum', link:['customers','conversations'] },
      ]
    };
  }

  /** 🔹 Support group with child entries (Dashboard + Tickets) */
  private supportGroup() {
    return {
      id: 'support',
      label: 'Support',
      icon: 'support_agent',
      children: [
        { id:'sup-dash',    label:'Dashboard', icon:'dashboard', link:['support'] },
        { id:'sup-tickets', label:'Tickets',   icon:'confirmation_number', link:['support','tickets'] },
      ]
    };
  }

  /** Nav for Owner/Admin/Manager (Settings appended last) */
  private readonly navForManagers = computed<any[]>(() => ([
    { id:'dash',   label:'Dashboard', icon:'dashboard', link:['dashboard'] },
    this.customersGroup(),
    {
      id:'sales',  label:'Sales',     icon:'sell',
      children: this.salesChildren()
    },
    this.supportGroup(),
    { id:'inv',    label:'Inventory', icon:'inventory_2',    link:['inventory'] },
    { id:'svc',    label:'Service',   icon:'build',          link:['service'] },
    { id:'del',    label:'Delivery',  icon:'local_shipping', link:['delivery'] },
    { id:'rent',   label:'Rentals',   icon:'two_wheeler',    link:['rentals'] },
    { id:'reports',label:'Reports',   icon:'insights',       link:['reports'] }, // reports visible to OWNER/ADMIN/MANAGER
  ]));

  /** Nav for Sales Reps (Settings appended last; Reports not visible to reps) */
  private readonly navForReps = computed<any[]>(() => ([
    { id:'dash',  label:'Dashboard', icon:'dashboard', link:['dashboard'] },
    this.customersGroup(),
    ...this.salesChildren(),
  ]));

  /** Single source of truth for Settings item */
  private SETTINGS_ITEM = () => ({
    id: 'set',
    label: 'Settings',
    icon: 'settings',
    link: ['settings'], // resolves under /location/:id/...
  });

  /** Final nav exposed to the side-nav component — Settings ALWAYS last */
  readonly navFiltered = computed<any[]>(() => {
    const admin = this.isAdminOwner();
    const r = this.roles();

    const base = admin || r.has('MANAGER')
      ? this.navForManagers()
      : r.has('SALES')
        ? this.navForReps()
        : [
            { id:'dash', label:'Dashboard', icon:'dashboard', link:['dashboard'] },
            this.customersGroup(),
          ];

    // Guarantee Settings is last and unique
    const withoutSettings = base.filter(item => item?.id !== 'set');
    return [...withoutSettings, this.SETTINGS_ITEM()];
  });
}
