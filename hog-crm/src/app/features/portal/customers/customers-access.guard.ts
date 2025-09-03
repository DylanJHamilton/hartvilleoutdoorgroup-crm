import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { isPrivilegedGlobal } from '../../../core/auth/roles.util';

export const customersAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.user();
  if (!user) {
    router.navigateByUrl('/login');
    return false;
  }

  // OWNER / ADMIN / MANAGER allowed
  if (isPrivilegedGlobal(user)) return true;

  // Hybrid/Staff: no Customers access
  router.navigateByUrl('/portal/dashboard');
  return false;
};