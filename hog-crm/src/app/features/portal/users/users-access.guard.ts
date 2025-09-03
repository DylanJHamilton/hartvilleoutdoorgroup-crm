import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { isPrivilegedGlobal } from '../../../core/auth/roles.util';

export const usersAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  return isPrivilegedGlobal(user) ? true : router.parseUrl('/portal/unauthorized');
};
