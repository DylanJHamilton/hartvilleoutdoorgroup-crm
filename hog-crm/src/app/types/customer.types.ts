// src/app/features/portal/customers/models/customer.type.ts
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  storeLocationId: string;        // required, single
  desiredProduct: string;
  salesOwnerUserId: string | null;
  additionalDetails?: string;
  value?: number;                  // potential deal value
  supportNotes?: string;           // latest note
  appointments?: Array<{
    id: string;
    title: string;
    startsAt: string;             // ISO
    endsAt?: string;              // ISO
    note?: string;
  }>;
  createdAt: string;               // ISO
  updatedAt: string;               // ISO
}
