// src/app/features/portal/customers/mocks/customers.mock.ts
import { Customer } from '../types/customer.types';

export const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-123-4567',
    storeLocationId: 'store-001',          // matches an existing store
    desiredProduct: '12x16 Shed',
    salesOwnerUserId: 'user-002',          // must match a mockUser id
    additionalDetails: 'Looking for financing options',
    value: 8500,
    supportNotes: 'Requested callback next week',
    appointments: [
      {
        id: 'appt-001',
        title: 'Initial Consultation',
        startsAt: '2025-09-05T10:00:00Z',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '555-987-6543',
    storeLocationId: 'store-002',
    desiredProduct: 'Golf Cart – Model X',
    salesOwnerUserId: 'user-003',
    additionalDetails: 'Wants delivery included',
    value: 12500,
    supportNotes: 'Follow-up scheduled',
    appointments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-003',
    name: 'Robert Johnson',
    email: 'r.johnson@example.com',
    phone: '555-222-3344',
    storeLocationId: 'store-001',
    desiredProduct: 'Tiny Home Cabin',
    salesOwnerUserId: null,                // unassigned
    additionalDetails: '',
    value: 32000,
    supportNotes: 'Very interested; asked for brochure',
    appointments: [
      {
        id: 'appt-002',
        title: 'Virtual Tour',
        startsAt: '2025-09-07T15:00:00Z',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
