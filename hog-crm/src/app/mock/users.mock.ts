export interface MockUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  locationIds: string[];
}

export const mockUsers: MockUser[] = [
  { id: 'u1', email: 'owner@demo.local',   name: 'Owner Ops',   roles: ['OWNER','ADMIN'], locationIds: ['s1','s2','s3'] },
  { id: 'u2', email: 'sales@demo.local',   name: 'Sally Sales', roles: ['SALES'],         locationIds: ['s1'] },
  { id: 'u3', email: 'service@demo.local', name: 'Sam Service', roles: ['SERVICE'],       locationIds: ['s2'] },
];
