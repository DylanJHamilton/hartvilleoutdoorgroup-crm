import { AfterViewInit, Component, ViewChild, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { mockUsers } from '../../../mock/users.mock';
import { mockStores } from '../../../mock/locations.mock';
import { AuthService } from '../../../core/auth/auth.service';
import { isPrivilegedGlobal, userLocationIds } from '../../../core/auth/roles.util';

import type { Role } from '../../../types/role.types';

// Dialogs
import { UserAddDialog, AddUserResult } from './dialog/user-add.dialog';
import { UserEditDialog, EditUserResult } from './dialog/user-edit.dialog';
import { DeletionRequestDialog, DeletionRequestResult } from './dialog/deletion-request.dialog';

interface ViewRow {
  id?: string;
  name: string;
  email: string;
  roles: string[];
  locations: string[]; // store names (resolved)
}

type RawUser = {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  orgId?: string;
  locationIds?: string[];
  assignments?: { locationId: string; roles: Role[] }[];
};

@Component({
  standalone: true,
  selector: 'hog-users',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
  template: `
    <section class="page users-page mat-light-override">
      <div class="header">
        <div>
          <div class="breadcrumb">Portal / Users</div>
          <h1 class="title">Employees</h1>
          <div class="subtitle">Manage admins, managers, and staff</div>
        </div>

        <div class="actions">
          <mat-form-field appearance="outline" class="w240">
            <mat-label>Search name or email</mat-label>
            <input matInput (keyup)="applyQuickFilter($event)" placeholder="Type to filter…" />
          </mat-form-field>

          <button mat-flat-button color="primary" (click)="onAdd()" *ngIf="isOwnerOrAdmin()">
            <mat-icon>person_add</mat-icon>
            <span>Add user</span>
          </button>
        </div>
      </div>

      <mat-card class="mat-elevation-z1 users-card">
        <mat-card-content>
          <div class="table-wrap">
            <table mat-table [dataSource]="dataSource" class="users-table">

              <!-- Name + Avatar -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">
                  <div class="user-cell">
                    <div class="avatar">
                      <mat-icon aria-hidden="true">person</mat-icon>
                    </div>
                    <div class="user-meta">
                      <div class="user-name">{{ row.name }}</div>
                      <div class="user-email">{{ row.email }}</div>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Roles -->
              <ng-container matColumnDef="roles">
                <th mat-header-cell *matHeaderCellDef>Roles</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip-set aria-label="Roles">
                    <mat-chip *ngFor="let r of row.roles" class="role-chip">{{ r }}</mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- Locations -->
              <ng-container matColumnDef="locations">
                <th mat-header-cell *matHeaderCellDef>Locations</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip-set aria-label="Locations">
                    <mat-chip *ngFor="let l of row.locations" class="loc-chip">{{ l }}</mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- Actions -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="col-actions">Actions</th>
                <td mat-cell *matCellDef="let row" class="col-actions">
                  <button class="edit" mat-button (click)="onEdit(row)" *ngIf="canEdit(row.email)">
                    <mat-icon>edit</mat-icon><span>Edit</span>
                  </button>

                  <button class="delete" mat-button color="warn" (click)="onDelete(row)" *ngIf="canHardDelete(row.email)">
                    <mat-icon>delete</mat-icon><span>Delete</span>
                  </button>

                  <button mat-stroked-button color="warn" (click)="onRequestDelete(row)" *ngIf="canRequestDeletion(row.email)">
                    <mat-icon>delete_outline</mat-icon><span>Request Deletion</span>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <mat-paginator [pageSize]="8" [pageSizeOptions]="[5,8,10,20]"></mat-paginator>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; gap:16px; }
    .header { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; }
    .breadcrumb { font-size:12px; color:rgba(0,0,0,.54); }
    .title { font:600 22px/1.2 system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial; margin:4px 0; color:#1a1a1a; }
    .subtitle { color:rgba(0,0,0,.7); font-size:13px; }
    .actions { display:flex; align-items:center; gap:12px; }
    .w240 { width:240px; }

    .users-card { background:#fff; }
    .table-wrap { overflow:auto; }

    .mat-light-override {
      --mdc-theme-surface: #ffffff;
      --mdc-theme-on-surface: rgba(0,0,0,0.87);
      --mdc-theme-background: #ffffff;
      --mdc-theme-on-background: rgba(0,0,0,0.87);
      --mat-app-background-color: #ffffff;

      --mat-table-background-color: #ffffff;
      --mat-table-row-item-outline-color: rgba(0,0,0,0.08);
      --mat-table-header-headline-color: rgba(0,0,0,0.87);
      --mat-table-row-item-label-text-color: rgba(0,0,0,0.87);
      --mat-table-row-item-icon-color: rgba(0,0,0,0.62);

      color: rgba(0,0,0,0.87);
      background: #fff;
    }

    table.users-table { width:100%; background:#fff; border-collapse:separate; border-spacing:0; }
    th.mat-header-cell { background:#fff; font-weight:600; }
    tr.mat-mdc-row:nth-child(even) { background:#fafafa; }
    tr.mat-mdc-row:hover { background:#f3f6fb; }
    td.mat-mdc-cell, th.mat-mdc-header-cell { border-bottom-color: rgba(0,0,0,0.08); }

    .user-cell { display:flex; align-items:center; gap:10px; }
    .avatar { width:36px; height:36px; border-radius:50%; background:#e9eef6; color:#3b4a66; display:inline-grid; place-items:center; }
    .avatar mat-icon { font-size:20px; }
    .user-meta { display:flex; flex-direction:column; }
    .user-name { font-weight:600; color:#1a1a1a; }
    .user-email { font-size:12px; color:rgba(0,0,0,.6); }

    /* Chips (readable), includes your extra rule */
    .role-chip {
      background: #eef3ff;
      color: #1a1a1a !important;
      border: 1px solid rgba(0,0,0,0.08) !important;
    }
    .loc-chip {
      background: #eef8f1;
      color: #1a1a1a !important;
      border: 1px solid rgba(0,0,0,0.08);
    }
    .mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__text-label{
      color: #1a1a1a !important;
    }

    .col-actions { white-space:nowrap; text-align:right; }
    .col-actions button { margin-left:4px; }

    .mat-mdc-paginator {
      background:#fff !important;
      color: rgba(0,0,0,0.87) !important;
      border-top: 1px solid rgba(0,0,0,0.08);
      border-radius: 0 0 12px 12px;
    }
    .mat-mdc-paginator .mat-mdc-icon-button .mat-mdc-button-touch-target,
    .mat-mdc-paginator .mat-mdc-icon-button,
    .mat-mdc-paginator .mat-mdc-icon-button mat-icon {
      color: rgba(0,0,0,0.62) !important;
      fill: rgba(0,0,0,0.62) !important;
    }
    .mat-mdc-paginator .mat-mdc-select-value,
    .mat-mdc-paginator .mat-mdc-select-arrow,
    .mat-mdc-paginator .mat-mdc-paginator-range-label {
      color: rgba(0,0,0,0.87) !important;
    }

    @media (max-width: 960px) { .user-email { display:none; } }
    .edit.mat-mdc-button:not(:disabled){
    color: #000;}
  `]
})
export class UsersPage implements AfterViewInit {
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns = ['name', 'roles', 'locations', 'actions'];
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
        .map(x => this.storeNames.get(x as any) ?? x) as string[]
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
      if (!q) return true;
      return row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q);
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

  canEdit(email: string): boolean {
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

  // -- Dialog flows --

  onAdd(): void {
    if (!this.isOwnerOrAdmin()) return;
    const dlg = this.dialog.open(UserAddDialog, {
      width: '560px',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'hog-dialog',     // <-- add this
      position: { top: '10vh' }     // optional, nudges down so panel opens below
    });
    dlg.afterClosed().subscribe((res?: AddUserResult) => {
      if (!res) return;
      const id = this.makeId();
      const next: RawUser = { id, name: res.name, email: res.email.toLowerCase(), roles: res.roles, locationIds: res.locationIds };
      this.model.set([next, ...this.model()]);
      this.refreshTable();
    });
  }

  onEdit(row: ViewRow): void {
    if (!this.canEdit(row.email)) return;
    const dlg = this.dialog.open(UserEditDialog, {
      width: '560px',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'hog-dialog',     // <-- add this
      position: { top: '10vh' },    // optional
      data: { email: row.email }
    });
    dlg.afterClosed().subscribe((res?: EditUserResult) => {
      if (!res) return;
      const list = this.model();
      const idx = list.findIndex(u => u.id === res.id);
      if (idx < 0) return;
      const updated: RawUser = { ...list[idx], name: res.name, email: res.email.toLowerCase(), roles: res.roles, locationIds: res.locationIds };
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
      data: { targetEmail: row.email, targetName: row.name }
    });
    dlg.afterClosed().subscribe((res?: DeletionRequestResult) => {
      if (!res) return;
      const target = (this.model() ?? []).find(u => u.email.toLowerCase() === row.email.toLowerCase());
      const actor = this.currentUser();
      if (!target || !actor) return;
      this.deletionRequests.set([
        { userId: target.id, requestedBy: (actor as any).id, reason: res.reason, at: new Date().toISOString() },
        ...this.deletionRequests()
      ]);
      // You could toast/snack here
    });
  }

  // helpers
  private makeId(): string {
    try { return (crypto as any).randomUUID(); } catch {}
    return 'u_' + Math.random().toString(36).slice(2, 10);
  }
}
