export type LocationType = 'Hartville' | 'Medina' | 'Mentor';

export interface LocationRef {
  id: string;
  code: LocationType;
  name: string;
}

export const mockStores: LocationRef[] = [
  { id: 's1', code: 'Hartville', name: 'Hartville Store' },
  { id: 's2', code: 'Medina',    name: 'Medina Store' },
  { id: 's3', code: 'Mentor',    name: 'Mentor Golf Cart Showroom' },
];
