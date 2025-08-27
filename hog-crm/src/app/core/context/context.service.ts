// src/app/core/context/context.service.ts
import { Injectable, signal, computed } from '@angular/core';
import type { Role } from '../../types/role.types';

export interface StoreRef { id: string; name: string; city?: string; }

@Injectable({ providedIn: 'root' })
export class ContextService {
  orgId = signal<string | null>(null);
  activeStore = signal<StoreRef | null>(null);
  roles = signal<Role[]>([]);

  isAdmin = computed(() => {
    const r = this.roles();
    return r.includes('OWNER') || r.includes('ADMIN');
  });

  setSession(opts: { orgId: string; roles: Role[]; store?: StoreRef }) {
    this.orgId.set(opts.orgId);
    this.roles.set(opts.roles);
    if (opts.store) this.activeStore.set(opts.store);
  }

  clear() {
    this.orgId.set(null);
    this.activeStore.set(null);
    this.roles.set([]);
  }
}
