// src/app/features/location/customers/services/customer-adapter.ts
import type { Customer as PortalCustomer } from '../../../location/../../types/customer.types';

// View type = what your current components expect (unchanged)
export interface ViewCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  interestedProduct?: string;   // maps to desiredProduct
  pipeline?: 'Sheds'|'Barns'|'Cabins'|'Furniture'|'Swing Sets'|'Trampolines'|'Playgrounds'|'Golf Carts'|'E-Bikes';
  stage?: 'Intake'|'Qualified'|'Quoted'|'Won'|'Delivered'|'Lost';
  owner?: string;               // maps to salesOwnerUserId
  createdAt: Date;              // maps from ISO
  notes?: string;               // maps to supportNotes

  // Needed for saving/loc scoping, but we hide it from your table
  storeLocationId?: string;
}

// UI -> Portal
export function toPortal(v: ViewCustomer): PortalCustomer {
  const nowISO = new Date().toISOString();
  return {
    id: v.id,
    name: v.name,
    email: v.email ?? '',
    phone: v.phone ?? '',
    storeLocationId: v.storeLocationId ?? '',

    desiredProduct: v.interestedProduct ?? '',
    salesOwnerUserId: v.owner ?? null,

    // keep optional fields empty so we don’t expand schema
    additionalDetails: undefined,
    value: undefined,
    supportNotes: v.notes,
    appointments: [],

    createdAt: v.createdAt?.toISOString?.() ?? nowISO,
    updatedAt: nowISO,
  };
}

// Portal -> UI
export function fromPortal(p: PortalCustomer): ViewCustomer {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,

    storeLocationId: p.storeLocationId,

    interestedProduct: p.desiredProduct,
    owner: p.salesOwnerUserId ?? undefined,

    createdAt: new Date(p.createdAt),
    notes: p.supportNotes,
  };
}
