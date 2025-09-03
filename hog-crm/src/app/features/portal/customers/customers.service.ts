import { Injectable, signal, WritableSignal } from '@angular/core';
import { Customer } from '../../../types/customer.types';
import { mockCustomers } from '../../../mock/customers.mock';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly customers: WritableSignal<Customer[]> = signal<Customer[]>(mockCustomers);

  list(): Customer[] {
    return this.customers();
  }

  getById(id: string): Customer | undefined {
    return this.customers().find(c => c.id === id);
  }

  create(customer: Customer): void {
    this.customers.update((list: Customer[]) => [...list, customer]);
  }

  update(updated: Customer): void {
    this.customers.update((list: Customer[]) => {
      const idx = list.findIndex((c: Customer) => c.id === updated.id);
      if (idx === -1) return list;
      const next = [...list];
      next[idx] = { ...updated, updatedAt: new Date().toISOString() };
      return next;
    });
  }

  delete(id: string): void {
    this.customers.update((list: Customer[]) => list.filter((c: Customer) => c.id !== id));
  }

  /** Manager “deletion request” stub — wire to Admin inbox later */
  requestDeletion(id: string, managerUserId: string, reason?: string): void {
    console.warn(`Deletion requested for customer ${id} by manager ${managerUserId}. Reason: ${reason ?? '(none)'}`);
  }
}