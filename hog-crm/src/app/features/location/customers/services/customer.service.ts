import { Injectable, signal } from '@angular/core';

export type Pipeline =
  'Sheds'|'Barns'|'Cabins'|'Furniture'|'Swing Sets'|'Trampolines'|'Playgrounds'|'Golf Carts'|'E-Bikes';

export type Stage = 'Intake'|'Qualified'|'Quoted'|'Won'|'Delivered'|'Lost';
export type Dept  = 'SALES'|'SUPPORT'|'SERVICE'|'DELIVERY';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;

  interestedProduct?: string;
  pipeline?: Pipeline;
  stage?: Stage;
  owner?: string;

  assignedDept?: Dept;        // display-only badge
  notes?: string;

  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private _items = signal<Customer[]>([
    {
      id: 'c1', name: 'John Doe', email: 'john@example.com', phone: '330-555-1100',
      interestedProduct: '10×12 Shed', pipeline: 'Sheds', stage: 'Qualified', owner: 'Alice',
      assignedDept: 'SALES',
      notes: 'Prefers Saturday delivery. Mentioned HOA restrictions.',
      createdAt: new Date()
    },
    {
      id: 'c2', name: 'Mary Brown', email: 'mary@example.com', phone: '330-555-2200',
      interestedProduct: 'EZGO Valor', pipeline: 'Golf Carts', stage: 'Intake', owner: 'Ben',
      assignedDept: 'SERVICE',
      notes: 'Battery test scheduled; call back Wed.',
      createdAt: new Date()
    },
  ]);

  readonly itemsSig = this._items.asReadonly();
  items(): Customer[] { return this._items(); }

  add(item: Omit<Customer, 'id'|'createdAt'>) {
    const id = crypto.randomUUID?.() ?? 'c' + Math.random().toString(36).slice(2, 9);
    const next: Customer = { ...item, id, createdAt: new Date() };
    this._items.update(list => [next, ...list]);
    return next;
  }

  update(id: string, changes: Partial<Customer>) {
    this._items.update(list => list.map(it => it.id === id ? { ...it, ...changes } : it));
  }

  remove(id: string) {
    this._items.update(list => list.filter(it => it.id !== id));
  }

  byId(id: string): Customer | undefined { return this._items().find(c => c.id === id); }
}
