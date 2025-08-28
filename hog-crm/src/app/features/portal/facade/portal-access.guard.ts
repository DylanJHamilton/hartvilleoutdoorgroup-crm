import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';

const ADMIN_ROLES = new Set(['OWNER','ADMIN','MANAGER']);

export const portalAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = auth.user()?.roles ?? [];
  const ok = roles.some(r => ADMIN_ROLES.has(r));
  return ok ? true : router.parseUrl('/portal/unauthorized');
};
