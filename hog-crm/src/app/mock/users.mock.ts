// src/app/mock/users.mock.ts
import type { User } from '../types/user.types';

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Olivia Owner',
    email: 'owner@demo.local',
    roles: ['OWNER'],
    orgId: 'hog',
    locationIds: ['s1','s2','s3'], // sees all locations
  },
  {
    id: 'u2',
    name: 'Alice Admin',
    email: 'admin@demo.local',
    roles: ['ADMIN'],
    orgId: 'hog',
    locationIds: ['s1','s2'], // multiple stores
  },
  {
    id: 'u3',
    name: 'Manny Manager',
    email: 'manager@demo.local',
    roles: ['MANAGER'],
    orgId: 'hog',
    locationIds: ['s2'], // single store
  },
  {
    id: 'u4',
    name: 'Sam Sales',
    email: 'sales@demo.local',
    roles: ['SALES'],
    orgId: 'hog',
    locationIds: ['s2'],
  },
  {
    id: 'u5',
    name: 'Sue Support',
    email: 'support@demo.local',
    roles: ['SUPPORT'],       // ok: SUPPORT → normalized to CS by dashboard logic
    orgId: 'hog',
    locationIds: ['s3'],
  },
  {
    id: 'u6',
    name: 'Ivan Inventory',
    email: 'inventory@demo.local',
    roles: ['INVENTORY'],
    orgId: 'hog',
    locationIds: ['s1'],
  },

  // 🔀 HYBRID USER (multiple hats & multiple locations)
  {
    id: 'u7',
    name: 'Hank Hybrid',
    email: 'hybrid@demo.local',
    roles: [],                  // no global privilege; hats are per-location
    orgId: 'hog',
    locationIds: ['s1', 's3'],  // assigned to two locations → qualifies for portal (scoped)
    assignments: [
      { locationId: 's1', roles: ['SALES', 'CS'] },  // two hats in Hartville
      { locationId: 's3', roles: ['SERVICE'] },      // different hat in Mentor
    ]
  },

  // 🧰 NEW: Service Technician (store s1)
  {
    id: 'u8',
    name: 'Tina Tech',
    email: 'service@demo.local',
    roles: ['SERVICE'],
    orgId: 'hog',
    locationIds: ['s1'],
  },

  // 🚚 NEW: Delivery Professional (store s2)
  {
    id: 'u9',
    name: 'Devon Driver',
    email: 'delivery@demo.local',
    roles: ['DELIVERY'],
    orgId: 'hog',
    locationIds: ['s2'],
  },
];
