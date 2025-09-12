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

// src/app/core/auth/roles.util.ts

export function isOwnerOrAdminUser(user: User | null | undefined): boolean {
  return !!user?.roles?.some(r => r === 'OWNER' || r === 'ADMIN');
}


// prefer default location if set; else single assignment; else null (let caller decide)
export function preferredLocationId(user: User | null | undefined): string | null {
  if (!user) return null;
  const locs = userLocationIds(user);
  if (!locs.length) return null;

  const pref = (user as any)?.settings?.defaultLocationId as string | undefined;
  if (pref && locs.includes(pref)) return pref;

  if (locs.length === 1) return locs[0];
  return null; // multiple, no explicit default
}

// Compute the landing path for any user, with a fallback for multi-location non-privileged users
// who need to pick a location first. Default fallback is /location/select but caller can override.
export function landingPathFor(user: User | null | undefined, fallbackSelect = '/location/select'): string {
  if (canSeeAllLocations(user)) return '/portal/dashboard';

  // Explicitly call the hybrid path for readability
  if (isHybridUser(user)) return landingPathForHybrid(user, fallbackSelect);

  // Non-privileged but not hybrid (no locations at all)
  const locs = userLocationIds(user);
  if (locs.length === 1) return `/location/${locs[0]}/dashboard`;
  if (locs.length > 1) return fallbackSelect;
  return '/no-access';
}

/** True only when the user is location-scoped (has >=1 locations) and NOT Owner/Admin/Manager. */
export function isHybridUser(user: User | null | undefined): boolean {
  return isHybrid(user); // you already defined isHybrid(user)
}

/** Only the assigned locations relevant to Hybrid routing / scoping. */
export function hybridLocationIds(user: User | null | undefined): string[] {
  return isHybridUser(user) ? userLocationIds(user) : [];
}

/** Hybrid’s preferred location: settings.defaultLocationId if valid; else the single assignment; else null. */
export function hybridPreferredLocationId(user: User | null | undefined): string | null {
  if (!isHybridUser(user)) return null;
  return preferredLocationId(user); // reuse the logic you already wrote
}

/** Compute the Hybrid landing path. Caller decides multi-loc behavior via fallbackSelect. */
export function landingPathForHybrid(
  user: User | null | undefined,
  fallbackSelect: string = '/location/select'
): string {
  const pref = hybridPreferredLocationId(user);
  if (pref) return `/location/${pref}/dashboard`;

  const locs = hybridLocationIds(user);
  if (locs.length === 1) return `/location/${locs[0]}/dashboard`;
  if (locs.length > 1) return fallbackSelect;

  return '/no-access';
}

// Optional helper (nice for readability)
export function isManagerUser(user: User | null | undefined): boolean {
  return !!user?.roles?.some(r => r === 'MANAGER');
}

