import { AfterViewInit, Component, ViewChild, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { mockUsers } from '../../../../mock/users.mock';
import { mockStores } from '../../../../mock/locations.mock';
import { AuthService } from '../../../../core/auth/auth.service';
import { isPrivilegedGlobal, userLocationIds } from '../../../../core/auth/roles.util';
import type { Role } from '../../../../types/role.types';

import { PerformanceService } from '../performance/performance.service';
import { PerformanceViewDialog } from '../performance/performance-view.dialog';
import { UserViewDialog } from '../dialog/user-view.dialog';

// ⬇️ bring back your existing user dialogs
import { UserAddDialog, AddUserResult } from '../dialog/user-add.dialog';
import { UserEditDialog, EditUserResult } from '../dialog/user-edit.dialog';
import { DeletionRequestDialog, DeletionRequestResult } from '../dialog/deletion-request.dialog';

interface ViewRow {
  id?: string;
  name: string;
  email: string;
  roles: string[];
  locations: string[];
}

type RawUser = {
  id: string; name: string; email: string;
  roles: Role[]; orgId?: string; locationIds?: string[];
  assignments?: { locationId: string; roles: Role[] }[];
};

@Component({
  standalone: true,
  selector: 'hog-users',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule,
    MatInputModule, MatDialogModule,
  ],
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage implements AfterViewInit {
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private perf = inject(PerformanceService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns = ['name', 'roles', 'locations', 'performance', 'actions'];
  dataSource = new MatTableDataSource<ViewRow>([]);
  quick = signal<string>('');

  private storeNames = new Map(mockStores.map(s => [s.id, s.name]));
  private model = signal<RawUser[]>(structuredClone(mockUsers as RawUser[]));
  private deletionRequests = signal<{ userId: string; requestedBy: string; reason?: string; at: string }[]>([]);

  rows = computed<ViewRow[]>(() =>
    (this.model() ?? []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roles: (u.roles ?? []) as string[],
      locations: (u.assignments?.map(a => this.storeNames.get(a.locationId) ?? a.locationId) ?? u.locationIds ?? [])
        .map(x => this.storeNames.get(x as any) ?? x) as string[],
    }))
  );

  currentUser = computed(() => {
    const a: any = this.auth;
    return typeof a.user === 'function' ? a.user() : a.currentUser ?? null;
  });

  private isOwnerAdminSig = computed(() => {
    const u = this.currentUser();
    const roles = (u?.roles ?? []) as Role[];
    const hasOA = roles.includes('OWNER') || roles.includes('ADMIN');
    return isPrivilegedGlobal(u) && hasOA;
  });

  isOwnerOrAdmin(): boolean { return this.isOwnerAdminSig(); }

  ngAfterViewInit(): void {
    this.refreshTable();
    this.dataSource.filterPredicate = (row: ViewRow, filter: string) => {
      const q = (filter || '').trim().toLowerCase();
      return !q || row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q);
    };
  }

  private refreshTable(): void {
    this.dataSource.data = this.rows();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
    else this.dataSource.paginator = this.paginator;
  }

  applyQuickFilter(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.quick.set(input.value || '');
    this.dataSource.filter = (input.value || '').trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  isSelf(email: string): boolean {
    return (this.currentUser()?.email || '').toLowerCase() === (email || '').toLowerCase();
  }

  private managerCanActOn(targetEmail: string): boolean {
    const actor = this.currentUser();
    if (!actor) return false;
    if (!(actor.roles ?? []).includes('MANAGER')) return false;

    const target = (this.model() ?? []).find(u => u.email.toLowerCase() === targetEmail.toLowerCase());
    if (!target) return false;

    const actorStores = new Set(userLocationIds(actor));
    const targetStores = new Set(userLocationIds(target as any));
    return [...actorStores].some(id => targetStores.has(id));
  }

  // --- visibility rules ---
  canViewPerformance(email: string): boolean {
    if (this.isOwnerOrAdmin()) return true;
    return this.managerCanActOn(email);
  }

  canEdit(email: string): boolean {
    // Owners/Admins: anyone; Managers: only their staff; User can edit self
    return this.isOwnerOrAdmin() || this.isSelf(email) || this.managerCanActOn(email);
  }

  canHardDelete(email: string): boolean {
    if (!this.isOwnerOrAdmin()) return false;
    if (this.isSelf(email)) return false;
    return true;
  }

  canRequestDeletion(email: string): boolean {
    if (this.isOwnerOrAdmin()) return false;
    if (this.isSelf(email)) return false;
    return this.managerCanActOn(email);
  }

  // ---------- View dialogs ----------
  onView(row: ViewRow): void {
    const list = this.model();
    const target = (list ?? []).find(u => u.email.toLowerCase() === row.email.toLowerCase());
    if (!target) return;

    this.dialog.open(UserViewDialog, {
      width: '760px',
      panelClass: 'hog-dialog',
      data: { user: target },
    });
  }

  onViewPerformance(row: ViewRow): void {
    if (!this.canViewPerformance(row.email)) return;
    const list = this.model();
    const target = (list ?? []).find(u => u.email.toLowerCase() === row.email.toLowerCase());
    if (!target) return;

    this.dialog.open(PerformanceViewDialog, {
      width: '720px',
      panelClass: 'hog-dialog',
      data: { userId: target.id, name: row.name },
    });
  }

  // ---------- Action handlers (wired to your existing dialogs) ----------
  onAdd(): void {
    if (!this.isOwnerOrAdmin()) return;
    const dlg = this.dialog.open(UserAddDialog, {
      width: '560px',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'hog-dialog',
      position: { top: '10vh' },
    });

    dlg.afterClosed().subscribe((res?: AddUserResult) => {
      if (!res) return;
      const id = this.makeId();
      const next: RawUser = {
        id,
        name: res.name,
        email: res.email.toLowerCase(),
        roles: res.roles,
        locationIds: res.locationIds
      };
      this.model.set([next, ...this.model()]);
      this.refreshTable();
    });
  }

  onEdit(row: ViewRow): void {
    if (!this.canEdit(row.email)) return;

    const target = (this.model() ?? []).find(u => u.email.toLowerCase() === row.email.toLowerCase());
    if (!target) return;

    const dlg = this.dialog.open(UserEditDialog, {
      width: '560px',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'hog-dialog',
      position: { top: '10vh' },
      data: { email: row.email }
    });

    dlg.afterClosed().subscribe((res?: EditUserResult) => {
      if (!res) return;
      const list = this.model();
      const idx = list.findIndex(u => u.id === res.id);
      if (idx < 0) return;

      const updated: RawUser = {
        ...list[idx],
        name: res.name,
        email: res.email.toLowerCase(),
        roles: res.roles,
        locationIds: res.locationIds
      };
      const next = [...list];
      next[idx] = updated;
      this.model.set(next);
      this.refreshTable();
    });
  }

  onDelete(row: ViewRow): void {
    if (!this.canHardDelete(row.email)) return;
    if (!confirm(`Delete ${row.name} (${row.email})?`)) return;

    const list = this.model();
    const next = list.filter(u => u.email.toLowerCase() !== row.email.toLowerCase());
    this.model.set(next);
    this.refreshTable();
  }

  onRequestDelete(row: ViewRow): void {
    if (!this.canRequestDeletion(row.email)) return;

    const dlg = this.dialog.open(DeletionRequestDialog, {
      width: '560px',
      disableClose: true,
      panelClass: 'hog-dialog',
      data: { targetEmail: row.email, targetName: row.name }
    });

    dlg.afterClosed().subscribe((res?: DeletionRequestResult) => {
      if (!res) return;
      const target = (this.model() ?? []).find(u => u.email.toLowerCase() === row.email.toLowerCase());
      const actor = this.currentUser();
      if (!target || !actor) return;

      this.deletionRequests.set([
        {
          userId: target.id,
          requestedBy: (actor as any).id,
          reason: res.reason,
          at: new Date().toISOString()
        },
        ...this.deletionRequests()
      ]);
      // TODO: snack/toast if you have a service
    });
  }

  // ---------- helpers ----------
  private makeId(): string {
    try { return (crypto as any).randomUUID(); } catch {}
    return 'u_' + Math.random().toString(36).slice(2, 10);
  }
}
