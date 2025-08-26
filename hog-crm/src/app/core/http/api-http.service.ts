// src/app/core/http/api-http.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../config/app-tokens';

@Injectable({ providedIn: 'root' })
export class ApiHttp {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  get<T>(url: string, options?: object) {
    return this.http.get<T>(this.join(url), options);
  }
  post<T>(url: string, body: any, options?: object) {
    return this.http.post<T>(this.join(url), body, options);
  }
  put<T>(url: string, body: any, options?: object) {
    return this.http.put<T>(this.join(url), body, options);
  }
  patch<T>(url: string, body: any, options?: object) {
    return this.http.patch<T>(this.join(url), body, options);
  }
  delete<T>(url: string, options?: object) {
    return this.http.delete<T>(this.join(url), options);
  }

  private join(url: string) {
    return url.startsWith('http') || url.startsWith('/') ? url : `${this.base}/${url}`;
  }
}
