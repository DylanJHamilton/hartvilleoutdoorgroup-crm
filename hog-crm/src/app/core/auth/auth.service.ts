// src/app/core/auth/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../config/app-tokens';
import type { User } from '../../types/user.types';
import type { Role } from '../../types/role.types';
import { mockUsers } from '../../mock/users.mock';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiBase = inject(API_BASE_URL);

  private readonly tokenKey = 'auth_token';
  private readonly roleKey = 'auth_role';
  private readonly userKey = 'auth_user';

  // In-memory fallbacks so nothing crashes if code executes during SSR
  private memoryToken: string | null = null;
  private memoryRole: Role | null = null;
  private memoryUser: User | null = null;

  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
  }

  // ---- Safe storage helpers (browser-only) ----
  private readLS(key: string): string | null {
    if (!this.isBrowser) return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  }
  private writeLS(key: string, val: string | null): void {
    if (!this.isBrowser) return;
    try {
      if (val === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, val);
    } catch { /* ignore */ }
  }

  // ---- TOKEN API ----
  getToken(): string | null {
    return this.readLS(this.tokenKey) ?? this.memoryToken;
  }
  setSession(token: string): void {
    this.memoryToken = token;
    this.writeLS(this.tokenKey, token);
  }
  logout(): void {
    this.memoryToken = null;
    this.memoryRole = null;
    this.memoryUser = null;
    this.writeLS(this.tokenKey, null);
    this.writeLS(this.roleKey, null);
    this.writeLS(this.userKey, null);
  }

  // ---- ROLE API ----
  getRole(): Role | null {
    const v = this.readLS(this.roleKey);
    return (v as Role) ?? this.memoryRole ?? null;
  }
  setRole(role: Role | null): void {
    this.memoryRole = role;
    this.writeLS(this.roleKey, role ?? null);
  }

  // ---- USER API ----
  getUser(): User | null {
    const raw = this.readLS(this.userKey);
    if (raw) {
      try { return JSON.parse(raw) as User; } catch { /* ignore */ }
    }
    return this.memoryUser;
  }
  setUser(u: User | null): void {
    this.memoryUser = u;
    this.writeLS(this.userKey, u ? JSON.stringify(u) : null);
  }

  // ---- STATUS ----
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ---- Legacy shims (compat with existing code) ----
  token(): string | null { return this.getToken(); }
  user(): User | null { return this.getUser(); }

 async signIn(email: string, _password: string, _remember = true): Promise<User> {
  const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw { error: { message: 'Invalid credentials' } };

  // persist session + user; DO NOT fabricate roles
  this.setSession('demo-token');
  this.setUser(user);
  this.setRole(null); // optional: clear legacy single-role slot to avoid confusion

  return user;
}

  signOut(): void {
    this.logout();
  }
}
