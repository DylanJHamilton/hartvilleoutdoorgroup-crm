import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ContextService } from '../../../core/context/context.service';

export const portalAccessGuard: CanActivateFn = () => {
  const ctx = inject(ContextService);
  const router = inject(Router);
  const roles = ctx.roles();
  const ok = roles.includes('OWNER') || roles.includes('ADMIN') || roles.includes('MANAGER');
  return ok ? true : router.parseUrl('/portal/unauthorized');
};
