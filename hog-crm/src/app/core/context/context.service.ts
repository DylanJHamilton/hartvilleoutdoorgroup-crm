// src/app/core/context/context.service.ts
import { Injectable, signal, computed } from '@angular/core';
import type { Role } from '../../types/role.types';

export interface LocationRef { id: string; name: string; city?: string; }

@Injectable({ providedIn: 'root' })
export class ContextService {
  orgId = signal<string | null>(null);
  activeLocation = signal<LocationRef | null>(null);
  roles = signal<Role[]>([]);

  isAdmin = computed(() => {
    const r = this.roles();
    return r.includes('OWNER') || r.includes('ADMIN');
  });

  setSession(opts: { orgId: string; roles: Role[]; location?: LocationRef }) {
    this.orgId.set(opts.orgId);
    this.roles.set(opts.roles);
    if (opts.location) this.activeLocation.set(opts.location);
  }

  clear() {
    this.orgId.set(null);
    this.activeLocation.set(null);
    this.roles.set([]);
  }
}
