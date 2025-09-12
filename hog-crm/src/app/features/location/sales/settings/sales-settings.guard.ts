import { inject } from '@angular/core';
import { CanMatchFn, Router, Route, UrlSegment } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { isOwnerOrAdminUser, isManagerUser, landingPathFor } from '../../../../core/auth/roles.util';

function currentUser(auth: any) {
  // Try common sync shapes (no async/subscriptions in canMatch)
  return (
    auth?.userSnapshot?.() ??
    (typeof auth?.user === 'function' ? auth.user() : undefined) ??
    auth?.userValue ??
    auth?.currentUser ??
    null
  );
}

export const SalesSettingsGuard: CanMatchFn = (_route: Route, _segments: UrlSegment[]) => {
  const auth = inject(AuthService) as any;
  const router = inject(Router);
  const user = currentUser(auth);

  // Allow OWNER / ADMIN / MANAGER
  if (isOwnerOrAdminUser(user) || isManagerUser(user)) return true;

  // Not allowed → send to a safe in-app page, not login
  return router.parseUrl(landingPathFor(user, '/location/select'));
};
