import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { mockStores } from '../../mock/locations.mock';

export const locationAccessGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const id = route.parent?.paramMap.get('locationId') ?? route.paramMap.get('locationId');
  const user = auth.user();            // ✅ available on your service
  const exists = mockStores.some(s => s.id === id);

  // minimal access rule for MVP: must be logged in and location must exist
  if (!auth.isLoggedIn() || !exists) return router.parseUrl('/portal');

  return true;
};
