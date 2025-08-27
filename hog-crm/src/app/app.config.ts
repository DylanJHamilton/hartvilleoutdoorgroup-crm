import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withDebugTracing, withHashLocation } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
// ⛔ Disable hydration while stabilizing (this avoids SSR code paths)
// import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withFetch,
} from '@angular/common/http';

import { routes } from './app.routes';
import { API_BASE_URL, APP_NAME } from './core/config/app-tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation(), withDebugTracing()), // ✅ hash routing => /#/auth/login
    provideNoopAnimations(),                   // ✅ simplest/safer while debugging
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
    { provide: APP_NAME, useValue: 'Hartville Outdoor CRM' },
  ],
};
