// src/app/core/auth/util/roles-scope.pure.ts
import type { User } from '../../../types/user.types';
import type { Role } from '../../../types/role.types';

export interface RolesScopeInput {
  user: User | null;
  requestedStoreId?: string | null;
  defaultStoreId?: string;       // e.g., first assigned store or '1'
}

export interface RolesScope {
  canAll: boolean;               // Owners/Admins can view all stores
  assignedIds: string[];         // Stores visible to this user
  effectiveStoreId: string;      // Chosen store id (may be '' if company-wide in your portal)
}

export function isPrivilegedGlobal(u: User | null): boolean {
  const r = u?.roles ?? [];
  return r.includes('OWNER') || r.includes('ADMIN');
}

/** Returns the list of store IDs the user can access. */
export function userLocationIds(u: User | null): string[] {
  // Primary: locationIds on your User type
  if (u?.locationIds && Array.isArray(u.locationIds)) return u.locationIds;

  // Optional legacy fallback if some callers still pass { locations: {id:string}[] }
  const anyU = u as unknown as { locations?: Array<{ id: string }> };
  if (Array.isArray(anyU?.locations)) {
    return anyU.locations
      .map((loc: { id: string }) => loc?.id)
      .filter((id: string | undefined): id is string => !!id);
  }

  return [];
}

/** If you later have per-location role mapping, implement here; for now return global roles. */
export function rolesForLocation(u: User | null, _id: string): Role[] {
  return (u?.roles ?? []) as Role[];
}

export function decideRolesScope(input: RolesScopeInput): RolesScope {
  const { user, requestedStoreId, defaultStoreId = '' } = input;
  const canAll = isPrivilegedGlobal(user);
  const assigned = userLocationIds(user);

  // Fallback: first assigned store, else provided default, else ''
  const fallback = assigned[0] ?? defaultStoreId ?? '';

  if (!canAll) {
    // Non-privileged users must be clamped to their assigned stores
    const eff = requestedStoreId && assigned.includes(requestedStoreId)
      ? requestedStoreId
      : fallback;
    return { canAll, assignedIds: assigned, effectiveStoreId: eff || '' };
  }

  // Privileged users: allow requested id ('' can mean company-wide in your UI)
  const eff = requestedStoreId ?? fallback;
  return { canAll, assignedIds: assigned, effectiveStoreId: eff };
}
