import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';            // <-- update if needed
import { rolesForLocation } from '../../../../core/auth/roles.util';        // <-- update if needed

@Injectable({ providedIn: 'root' })
export class SupportRoleService {
  private auth = inject(AuthService);

  private roles(locId: string): string[] {
    const user = this.auth.getUser();
    return rolesForLocation(user, locId).map(r => String(r).toUpperCase());
  }

  isOwnerOrAdmin(locId: string) {
    const r = this.roles(locId);
    return r.includes('OWNER') || r.includes('ADMIN');
  }
  isManagerPlus(locId: string) {
    const r = this.roles(locId);
    return this.isOwnerOrAdmin(locId) || r.includes('MANAGER');
  }
  /** CSR/Support only — excludes Manager/Admin/Owner */
  isCSR(locId: string) {
    const r = this.roles(locId);
    return (r.includes('SUPPORT') || r.includes('CS')) && !this.isManagerPlus(locId) && !this.isOwnerOrAdmin(locId);
  }
  /** Staff incl. managers (kept for other pages if you need it) */
  isSupportStaff(locId: string) {
    const r = this.roles(locId);
    return r.includes('SUPPORT') || r.includes('CS') || this.isManagerPlus(locId);
  }

  currentOwnerId(): string {
    const u = this.auth.getUser();
    return u?.name || 'CS-1';
  }
}