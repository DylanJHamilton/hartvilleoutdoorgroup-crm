import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    // If someone hits /auth/login while logged in, bounce them to their landing
    if (state.url.startsWith('/auth/login')) {
      const target = auth.getPostLoginTarget();
      return router.parseUrl(target);
    }
    return true;
  }

  // Not logged in: send to login with returnUrl
  return router.parseUrl(`/auth/login?returnUrl=${encodeURIComponent(state.url)}`);
};
