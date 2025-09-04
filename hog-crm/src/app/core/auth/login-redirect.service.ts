// src/app/core/auth/login-redirect.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { User } from '../../types/user.types';
import {
  canSeeAllLocations,
  isHybrid,
  preferredLocationId,
  userLocationIds,
} from './roles.util';

@Injectable({ providedIn: 'root' })
export class LoginRedirectService {
  private router = inject(Router);

  /** Pure function: returns the landing URL for a freshly authenticated user */
  getLandingUrl(user: User | null): string {
    if (!user) return '/auth/login';

    // Owners/Admins -> Portal (full)
    if (canSeeAllLocations(user)) return '/portal';

    // Managers + Hybrids -> Portal (scoped)
    const isManager = !!user.roles?.includes('MANAGER');
    if (isManager || isHybrid(user)) return '/portal';

    // Everyone else: prefer specific location when obvious
    const pref = preferredLocationId(user);        // honors settings.defaultLocationId and single-location
    if (pref) return `/location/${pref}/dashboard`;

    const locs = userLocationIds(user);
    if (locs.length > 1) return '/location/select'; // optional picker if you support it
    if (locs.length === 1) return `/location/${locs[0]}/dashboard`;

    return '/no-access';
  }

  /** Side-effect: immediately navigate there */
  goHome(user: User | null) {
    const url = this.getLandingUrl(user);
    this.router.navigateByUrl(url);
  }
}
