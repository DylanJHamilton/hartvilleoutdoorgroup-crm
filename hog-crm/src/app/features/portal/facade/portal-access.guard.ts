// src/app/features/portal/facade/portal-access.guard.ts
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import type { User } from '../../../types/user.types';
import { AuthService } from '../../../core/auth/auth.service';

const PRIV_ROLES = new Set(['OWNER', 'ADMIN', 'MANAGER']);

function isPrivileged(u: User | null | undefined): boolean {
  return !!u?.roles?.some(r => PRIV_ROLES.has(r));
}

// counts unique assigned location ids; supports future `assignments` as well
function getAllLocationIds(u: User | null | undefined): string[] {
  if (!u) return [];
  const basic = u.locationIds ?? [];
  const assigned = (u as any).assignments?.map((a: any) => a.locationId) ?? [];
  return Array.from(new Set([...basic, ...assigned]));
}

export const portalAccessGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth   = inject(AuthService);

  // Works with your current AuthService API
  const user: User | null =
    typeof (auth as any).user === 'function'
      ? (auth as any).user()
      : (auth as any).currentUser ?? null;

  if (isPrivileged(user)) return true;                 // full portal
  const locIds = getAllLocationIds(user);
  if (locIds.length >= 2) return true;                 // hybrid → scoped portal

  // non-privileged and 0–1 location → send to their dashboard or login
  const dest = locIds[0] ? `/location/${locIds[0]}/dashboard` : '/auth/login';
  const redirect: UrlTree = router.parseUrl(dest);
  return redirect;
};
