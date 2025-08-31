// src/app/core/auth/roles.util.ts
import type { User } from '../../types/user.types';
import type { Role } from '../../types/role.types';

export const PRIV: ReadonlySet<Role> = new Set(['OWNER','ADMIN','MANAGER']);

export function isPrivilegedGlobal(user: User | null | undefined): boolean {
  return !!user?.roles?.some(r => PRIV.has(r));
}


export function userLocationIds(user: User | null | undefined): string[] {
  if (!user) return [];
  const a = user.assignments?.map(x => x.locationId) ?? [];
  const b = user.locationIds ?? [];
  return Array.from(new Set([...a, ...b]));
}

// NEW: Only OWNER/ADMIN see ALL locations in portal.
// MANAGER is portal-allowed but scoped to assigned locations.
export function canSeeAllLocations(user: User | null | undefined): boolean {
  return !!user?.roles?.some(r => r === 'OWNER' || r === 'ADMIN');
}

export function hasAccessToLocation(user: User | null | undefined, locationId: string): boolean {
  if (!user) return false;
  if (user.locationIds?.includes(locationId)) return true;
  return !!user.assignments?.some(a => a.locationId === locationId);
}


/** Hybrid = not privileged globally, but assigned to >= 1 locations */
export function isHybrid(user: User | null | undefined): boolean {
  return !isPrivilegedGlobal(user) && userLocationIds(user).length > 0;
}

export function rolesForLocation(user: User | null | undefined, locationId: string): Role[] {
  if (!user) return [];
  const local = user?.assignments?.find(a => a.locationId === locationId)?.roles ?? [];
  // effective = union of global + per-location roles
  return Array.from(new Set<Role>([...(user.roles ?? []), ...local]));
}