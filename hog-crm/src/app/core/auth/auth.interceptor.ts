// src/app/core/auth/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { ContextService } from '../context/context.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const ctx = inject(ContextService);

  let headers = req.headers.set('X-Client', 'hog-crm');
  const token = auth.token();
  if (token) headers = headers.set('Authorization', `Bearer ${token}`);
  const store = ctx.activeLocation();
  if (store) headers = headers.set('X-Store-Id', store.id);

  return next(req.clone({ headers, withCredentials: true }));
};
