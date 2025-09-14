import { Injectable, signal } from '@angular/core';

export interface CustomerAppointment {
  id: string;
  title: string;
  startsAt: string;   // ISO
  endsAt?: string;    // ISO
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerAppointmentsService {
  // customerId -> appointments[]
  private _map = signal<Record<string, CustomerAppointment[]>>({
    c1: [],
    c2: []
  });

  appointments(customerId: string): CustomerAppointment[] {
    return [...(this._map()[customerId] ?? [])].sort((a,b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  }

  add(customerId: string, appt: Omit<CustomerAppointment,'id'>) {
    const id = 'ap' + Math.random().toString(36).slice(2,9);
    const cur = this._map()[customerId] ?? [];
    this._map.update(m => ({ ...m, [customerId]: [...cur, { id, ...appt }] }));
  }
}
