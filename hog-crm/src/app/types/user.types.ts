export type Role =
  | 'OWNER' | 'ADMIN' | 'MANAGER'
  | 'SALES' | 'SERVICE' | 'DELIVERY'
  | 'RENTALS' | 'INVENTORY' | 'CS';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  orgId: string;
  storeIds: string[];
}
