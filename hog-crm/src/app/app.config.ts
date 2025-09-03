import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  importProvidersFrom
} from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import {
  provideHttpClient,
} from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { routes } from './app.routes';
import { API_BASE_URL, APP_NAME } from './core/config/app-tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()), // ✅ hash routing => /#/auth/login
    provideHttpClient(),
    importProvidersFrom(MatSnackBarModule),
    { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
    { provide: APP_NAME, useValue: 'Hartville Outdoor CRM' },
  ],
};
