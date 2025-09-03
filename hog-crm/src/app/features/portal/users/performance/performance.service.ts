import { Injectable, inject, signal, WritableSignal, computed } from '@angular/core';
import type { Performance } from '../../../../types/performance.types';
import { mockPerformance } from '../../../../mock/performance.mock';
import { AuthService } from '../../../../core/auth/auth.service';
import { isPrivilegedGlobal, userLocationIds } from '../../../../core/auth/roles.util';
import { mockUsers } from '../../../../mock/users.mock';

/**
 * Provides role-scoped access to employee performance.
 * - Owners/Admins: see all
 * - Managers: see only employees who share at least one store with them
 * - Others (Hybrids/Staff): no access
 */
@Injectable({ providedIn: 'root' })
export class PerformanceService {
  private auth = inject(AuthService);
  private store: WritableSignal<Performance[]> = signal<Performance[]>(mockPerformance);

  /** Raw list (do not use directly in UI unless you’re an admin path). */
  all = computed(() => this.store());

  /** All records for a specific user (unscoped; caller is responsible for access checks). */
  byUser(userId: string): Performance[] {
    return this.store().filter(p => p.userId === userId);
  }

  /** Latest record for a user (by period, string-lexicographic; keep periods consistent like '2025-Q3' or '2025-09'). */
  latestForUser(userId: string): Performance | undefined {
    const items = this.byUser(userId);
    return items.sort((a, b) => (a.period > b.period ? -1 : 1))[0];
  }

  /** Return the set of userIds the current viewer is allowed to see. */
  scopedUserIds(): Set<string> {
    const viewer = this.auth.user();
    if (!viewer) return new Set();

    if (isPrivilegedGlobal(viewer)) {
      return new Set(this.store().map(p => p.userId));
    }

    // Manager scope: any employee who shares at least one store with manager
    if ((viewer.roles ?? []).includes('MANAGER')) {
      const mgrStores = new Set(userLocationIds(viewer));
      const allowed = mockUsers
        .filter(u => {
          const staffStores = new Set(userLocationIds(u as any));
          for (const id of staffStores) if (mgrStores.has(id)) return true;
          return false;
        })
        .map(u => u.id);
      return new Set(allowed);
    }

    // Hybrids/Staff: no access
    return new Set();
  }

  /** Records visible to current viewer, grouped by userId. */
  scopedByUser(): { userId: string; records: Performance[] }[] {
    const allowed = this.scopedUserIds();
    if (!allowed.size) return [];
    const m = new Map<string, Performance[]>();
    for (const p of this.store()) {
      if (!allowed.has(p.userId)) continue;
      if (!m.has(p.userId)) m.set(p.userId, []);
      m.get(p.userId)!.push(p);
    }
    // Sort each user’s records by period desc (string compare, keep period format consistent)
    return [...m.entries()].map(([userId, records]) => ({
      userId,
      records: records.sort((a, b) => (a.period > b.period ? -1 : 1)),
    }));
  }

  updateManagerFields(
  userId: string,
  period: string,
  patch: { onTimeRate?: number | null; attitudeScore?: number | null; coachingNotes?: string | null; }
): void {
  this.store.update(list => {
    const idx = list.findIndex(p => p.userId === userId && p.period === period);
    if (idx === -1) return list;

    const updates: Partial<Performance> = {};
    if (patch.onTimeRate !== undefined && patch.onTimeRate !== null) updates.onTimeRate = patch.onTimeRate;
    if (patch.attitudeScore !== undefined && patch.attitudeScore !== null) updates.attitudeScore = patch.attitudeScore;
    if (patch.coachingNotes !== undefined && patch.coachingNotes !== null) updates.coachingNotes = patch.coachingNotes;

    const next = [...list];
    next[idx] = { ...next[idx], ...updates };
    return next;
  });
}


}
