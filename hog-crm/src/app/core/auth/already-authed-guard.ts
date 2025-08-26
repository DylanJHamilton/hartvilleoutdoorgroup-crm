import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { LoginRedirectService } from './login-redirect.service';

export const alreadyAuthedGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const redirect = inject(LoginRedirectService);

  if (auth.isLoggedIn()) {
    redirect.goHome();
    return false;
  }
  return true;
};
