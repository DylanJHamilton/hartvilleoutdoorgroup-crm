import { Injectable, inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { User } from '../../types/user.types';

@Injectable({ providedIn: 'root' })
export class LoginRedirectService {
  private router = inject(Router);
  private auth = inject(AuthService);

  // Existing method stays (used after form submit, etc.)
  goHome(user?: User) {
    const url = this.homeUrlTree(user);
    this.router.navigateByUrl(url);
  }

  // New: pure redirect as UrlTree (safe for guards)
  homeUrlTree(user?: User): UrlTree {
    const u = user ?? this.auth.user();
    const roles = u?.roles ?? [];
    const stores = u?.storeIds ?? [];

    const isAdmin = roles.some(r => r === 'OWNER' || r === 'ADMIN' || r === 'MANAGER');

    if (isAdmin || stores.length !== 1) {
      return this.router.parseUrl('/portal');
    }
    // If you already have /store/:id, use that. If not, send to /portal for now.
    return this.router.parseUrl(stores.length === 1 ? `/store/${stores[0]}` : '/portal');
  }
}
