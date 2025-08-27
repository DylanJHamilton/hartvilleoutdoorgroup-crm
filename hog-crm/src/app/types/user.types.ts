import type { Role } from './role.types';


export interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  orgId: string;
  storeIds: string[];
}
