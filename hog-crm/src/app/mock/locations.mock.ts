export type LocationType = 'Hartville' | 'Medina' | 'Mentor';

export interface LocationRef {
  id: string;
  code: LocationType;
  name: string;
}

export const mockStores: LocationRef[] = [
  { id: 's1', code: 'Hartville', name: 'Hartville HQ' },
  { id: 's2', code: 'Medina',    name: 'Medina Superstore' },
  { id: 's3', code: 'Mentor',    name: 'Mentor Showroom' },
];
