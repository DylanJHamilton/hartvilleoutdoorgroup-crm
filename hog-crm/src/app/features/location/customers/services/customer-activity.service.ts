import { Injectable, signal } from '@angular/core';

export type ActivityKind = 'note'|'call'|'email'|'ticket'|'order'|'service';

export interface CustomerActivity {
  id: string;
  dateISO: string;
  kind: ActivityKind;
  summary: string;
  byUserId?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerActivityService {
  // customerId -> activities[]
  private _map = signal<Record<string, CustomerActivity[]>>({
    c1: [
      { id: 'a1', dateISO: new Date().toISOString(), kind: 'note', summary: 'Initial intake completed.' }
    ],
    c2: []
  });

  activities(customerId: string): CustomerActivity[] {
    return [...(this._map()[customerId] ?? [])].sort((a,b) => +new Date(b.dateISO) - +new Date(a.dateISO));
  }

  add(customerId: string, payload: { kind: ActivityKind; summary: string; byUserId?: string }) {
    const id = 'a' + Math.random().toString(36).slice(2, 9);
    const next: CustomerActivity = { id, dateISO: new Date().toISOString(), ...payload };
    const cur = this._map()[customerId] ?? [];
    this._map.update(m => ({ ...m, [customerId]: [next, ...cur] }));
  }
}
