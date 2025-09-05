// src/app/features/location/components/location-shell.component.ts
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
    this.router.events.pipe(
      startWith(0),
      map(() => storeIdFromUrl(this.router.url))
    ),
    { initialValue: storeIdFromUrl(this.router.url) }
  );

  /** 's1' | 's2' | 's3' (default 's1' if missing) */
  readonly locationId = computed<'s1'|'s2'|'s3'|string>(() => this.urlStoreId() || 's1');

  /** Friendly store name */
  readonly locationShort = computed(() => LOCATION_NAME_BY_ID[this.locationId()] ?? 'Location');

  // === SideNav header lines ===
  orgBrand      = computed(() => ORG_NAME);
  storeSubtitle = computed(() => `${this.locationShort()} (Location)`);

  // Blue bar title from the active child route's *routeConfig.title* (fallback "Dashboard")
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

  settingsLink = computed<any[]>(() => ['/location', this.locationId(), 'settings']);

  signOut() {
    try { (this.auth as any)?.signOut?.(); } catch {}
    this.router.navigateByUrl('/auth/login'); // adjust if needed
  }

  // ---- role-aware nav (unchanged) ----
  private readonly user         = computed(() => this.auth.getUser() ?? null);
  private readonly isAdminOwner = computed(() => !!this.user() && isOwnerOrAdminUser(this.user()!));
  private readonly roles        = computed<Set<string>>(() => {
    const rs = this.user() ? rolesForLocation(this.user()!, this.locationId()) ?? [] : [];
    return new Set(rs.map(r => String(r).toUpperCase()));
  });

  private readonly navBase: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',       link: ['dashboard']  },
    { label: 'Sales',      icon: 'sell',            link: ['sales']      },
    { label: 'Inventory',  icon: 'inventory_2',     link: ['inventory']  },
    { label: 'Service',    icon: 'build',           link: ['service']    },
    { label: 'Delivery',   icon: 'local_shipping',  link: ['delivery']   },
    { label: 'Rentals',    icon: 'two_wheeler',     link: ['rentals']    },
    { label: 'Support',    icon: 'support_agent',   link: ['support']    },
    { label: 'Reports',    icon: 'analytics',       link: ['reports']    },
    { label: 'Settings',   icon: 'settings',        link: ['settings']   },
  ];

  private canSeeSegment = (seg: string): boolean => {
    const roles = this.roles(); const admin = this.isAdminOwner();
    if (seg === 'dashboard' || seg === 'reports') return true;
    switch (seg) {
      case 'sales':     return admin || roles.has('MANAGER') || roles.has('SALES');
      case 'inventory': return admin || roles.has('MANAGER') || roles.has('INVENTORY');
      case 'service':   return admin || roles.has('MANAGER') || roles.has('SERVICE');
      case 'delivery':  return admin || roles.has('MANAGER') || roles.has('DELIVERY');
      case 'rentals':   return admin || roles.has('MANAGER') || roles.has('RENTALS');
      case 'support':   return admin || roles.has('MANAGER') || roles.has('SUPPORT') || roles.has('CS');
      case 'settings':  return admin || roles.has('MANAGER');
      default:          return false;
    }
  };

  readonly navFiltered = computed<NavItem[]>(() =>
    this.navBase.filter(n => this.canSeeSegment(String(Array.isArray(n.link) ? n.link[0] : n.link)))
  );
}
