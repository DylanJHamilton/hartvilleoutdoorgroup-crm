// src/app/types/user.types.ts
import type { Role } from './role.types';
import type { UserSettings } from './userSettings.types';

export interface LocationAssignment {
  locationId: string;   // 's1' | 's2' | 's3' ...
  roles: Role[];        // roles *in that location* (can be multiple)
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];          // GLOBAL roles (can be multiple hats)
  orgId: string;
  locationIds: string[];  // legacy/simple list (keep for compat)
  assignments?: LocationAssignment[]; // per-location roles (optional)
  settings?: UserSettings;            // <-- NEW (optional, universal settings)
  avatarUrl?: string;
}
