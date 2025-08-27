// src/app/features/store/store-access.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

export const storeAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();

  // If not logged in → send to login
  if (!user) return router.parseUrl('/auth/login');

  // TODO: keep your real check here
  const ok = true; // replace with your role/store logic

  // If not allowed → send to a stable page (NOT '/')
  return ok ? true : router.parseUrl('/portal');
};
