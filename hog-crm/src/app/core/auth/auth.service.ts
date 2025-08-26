import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/app-tokens';

export type Role =
  | 'OWNER' | 'ADMIN' | 'MANAGER'
  | 'SALES' | 'SERVICE' | 'DELIVERY'
  | 'RENTALS' | 'INVENTORY' | 'CS';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  orgId: string;
  storeIds: string[];
}

const KEY = 'hog-auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  readonly user = signal<User | null>(null);
  readonly token = signal<string | null>(null);
  readonly isLoggedIn = computed(() => !!this.token());

  constructor() {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        const { token, user } = JSON.parse(raw);
        this.token.set(token);
        this.user.set(user);
      } catch {}
    }
  }

  async signIn(email: string, password: string, remember = true) {
    const res = await firstValueFrom(
      this.http.post<{ token: string; user: User }>(`${this.base}/auth/login`, { email, password })
    );
    this.token.set(res.token);
    this.user.set(res.user);
    if (remember) localStorage.setItem(KEY, JSON.stringify(res));
    return res.user;
  }

  signOut() {
    this.token.set(null);
    this.user.set(null);
    localStorage.removeItem(KEY);
  }
}
