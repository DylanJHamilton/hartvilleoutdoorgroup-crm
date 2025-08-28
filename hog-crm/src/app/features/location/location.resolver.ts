import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { ContextService } from '../../core/context/context.service';
import { AuthService } from '../../core/auth/auth.service';

export const locationResolver: ResolveFn<boolean> = (route: ActivatedRouteSnapshot) => {
  const ctx = inject(ContextService);
  const auth = inject(AuthService);
  const user = auth.user();
  const storeId = route.paramMap.get('storeId')!;
  if (user) {
    const store = { id: storeId, name: `Store ${storeId}` }; // TODO: replace with API fetch
    ctx.setSession({ orgId: user.orgId, roles: user.roles, location: store   });
  }
  return true;
};
