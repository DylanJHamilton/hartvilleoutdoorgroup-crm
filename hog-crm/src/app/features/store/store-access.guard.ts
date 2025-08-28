import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

export const storeAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();

  if (!user) return router.parseUrl('/auth/login');

  // Example rule: require at least one store
  const ok = (user.storeIds ?? []).length > 0;
  return ok ? true : router.parseUrl('/portal');
};
