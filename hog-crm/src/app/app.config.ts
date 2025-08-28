import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withDebugTracing, withHashLocation } from '@angular/router';
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
    provideRouter(routes, withHashLocation()), // ✅ hash routing => /#/auth/login
    provideHttpClient(),
    { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
    { provide: APP_NAME, useValue: 'Hartville Outdoor CRM' },
  ],
};
