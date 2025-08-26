import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from './auth.service';

@Injectable({ providedIn: 'root' })
export class LoginRedirectService {
  private router = inject(Router);
  private auth = inject(AuthService);

  // Decide where to land after login
  goHome(user?: User) {
    const u = user ?? this.auth.user()!;
    const roles = u.roles ?? [];
    const stores = u.storeIds ?? [];

    // Managers/Admins/Owners or users with multiple stores → Portal
    if (roles.some(r => ['OWNER','ADMIN','MANAGER'].includes(r)) || stores.length !== 1) {
      this.router.navigate(['/portal']);
      return;
    }
    // Exactly one store → go straight to that store
    this.router.navigate(['/store', stores[0]]);
  }
}
