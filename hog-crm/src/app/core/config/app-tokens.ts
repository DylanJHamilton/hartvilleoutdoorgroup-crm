import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => '/api', // default for dev proxy or same-origin
});

export const APP_NAME = new InjectionToken<string>('APP_NAME', {
  factory: () => 'HOG CRM',
});
