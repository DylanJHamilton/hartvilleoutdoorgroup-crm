import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { User } from '../../types/user.types';
import type { Role } from '../../types/role.types';

@Injectable({ providedIn: 'root' })
export class LoginRedirectService {
  private router = inject(Router);

  private isPrivileged(roles: Role[] = []): boolean {
    return roles.some(r =>
      r === 'OWNER' ||
      r === 'ADMIN' ||
      r === 'MANAGER'
    );
  }

  private pickPrimaryLocationId(user: User): string | null {
    const ids = user.locationIds ?? [];
    return ids.length > 0 ? ids[0] : null;
  }

  /** Pure function: returns the landing URL for a freshly authenticated user */
  getLandingUrl(user: User | null): string {
    if (!user) return '/auth/login';

    if (this.isPrivileged(user.roles)) {
      return '/portal';
    }

    const loc = this.pickPrimaryLocationId(user);
    return loc ? `/location/${loc}/dashboard` : '/portal'; // fallback
  }

  /** Side-effect: immediately navigate there */
  goHome(user: User | null) {
    const url = this.getLandingUrl(user);
    this.router.navigateByUrl(url);
  }
}
