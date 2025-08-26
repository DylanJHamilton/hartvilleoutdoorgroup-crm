import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

export const storeAccessGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  const storeId = route.paramMap.get('storeId') || '';

  if (!user) { router.navigate(['/auth/login']); return false; }

  const isPower = user.roles.some(r => ['OWNER','ADMIN','MANAGER'].includes(r));
  const canAccess = isPower || user.storeIds.includes(storeId);
  if (canAccess) return true;

  // Not allowed to open this store → send to portal
  router.navigate(['/portal']);
  return false;
};
