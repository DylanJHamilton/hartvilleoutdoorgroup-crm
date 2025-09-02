// src/app/features/portal/users/users.page.ts
import { AfterViewInit, Component, ViewChild, ViewEncapsulation, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MatTableDataSource } from '@angular/material/table';

import { mockUsers } from '../../../mock/users.mock';
import { mockStores } from '../../../mock/locations.mock';
import { AuthService } from '../../../core/auth/auth.service';

interface ViewRow {
  id?: string;
  name: string;
  email: string;
  roles: string;
  locations: string;
}

@Component({
  standalone: true,
  selector: 'hog-users',
  encapsulation: ViewEncapsulation.None, // allow style overrides (table + paginator)
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <section class="page users-page mat-light-override">
      <div class="header">
        <div>
          <div class="breadcrumb">Portal / Users</div>
          <h1 class="title">Employees</h1>
          <div class="subtitle">Manage admins, managers, and staff</div>
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
                <td mat-cell *matCellDef="let row">{{ row.roles }}</td>
              </ng-container>

              <!-- Locations -->
              <ng-container matColumnDef="locations">
                <th mat-header-cell *matHeaderCellDef>Locations</th>
                <td mat-cell *matCellDef="let row">{{ row.locations }}</td>
              </ng-container>

              <!-- Actions -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="col-actions">Actions</th>
                <td mat-cell *matCellDef="let row" class="col-actions">
                  <button mat-button (click)="onEdit(row)" *ngIf="canEdit(row.email)">
                    <mat-icon>edit</mat-icon><span>Edit</span>
                  </button>

                  <button mat-button color="warn" (click)="onDelete(row)"
                          *ngIf="isAdmin() && !isSelf(row.email)">
                    <mat-icon>delete</mat-icon><span>Delete</span>
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
    /* ---------- Page basics ---------- */
    .page { display:flex; flex-direction:column; gap:16px; }
    .header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
    .breadcrumb { font-size:12px; color:rgba(0,0,0,.54); }
    .title { font:600 22px/1.2 system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial; margin:4px 0; color:#1a1a1a; }
    .subtitle { color:rgba(0,0,0,.7); font-size:13px; }

    .users-card { background:#fff; }
    .table-wrap { overflow:auto; }

    /* ---------- Light theme overrides (table + paginator) ---------- */
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

    .users-table,
    .users-table * {
      color: rgba(0,0,0,0.87);
      fill: rgba(0,0,0,0.87);
      background-color: transparent;
    }

    table.users-table {
      width:100%;
      background:#fff;
      border-collapse:separate;
      border-spacing:0;
    }

    th.mat-header-cell { background:#fff; font-weight:600; }

    tr.mat-mdc-row:nth-child(even) { background:#fafafa; }
    tr.mat-mdc-row:hover { background:#f3f6fb; }

    td.mat-mdc-cell, th.mat-mdc-header-cell {
      border-bottom-color: rgba(0,0,0,0.08);
    }

    /* ---------- Avatar + name layout ---------- */
    .user-cell { display:flex; align-items:center; gap:10px; }
    .avatar {
      width:36px; height:36px; border-radius:50%;
      background:#e9eef6; color:#3b4a66;
      display:inline-grid; place-items:center;
    }
    .avatar mat-icon { font-size:20px; }
    .user-meta { display:flex; flex-direction:column; }
    .user-name { font-weight:600; color:#1a1a1a; }
    .user-email { font-size:12px; color:rgba(0,0,0,.6); }

    /* ---------- Actions column ---------- */
    .col-actions { white-space:nowrap; text-align:right; }
    .col-actions button { margin-left:4px; }

    /* ---------- Paginator light styling ---------- */
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

    @media (max-width: 960px) {
      .user-email { display:none; }
    }
  `]
})
export class UsersPage implements AfterViewInit {
  private auth = inject(AuthService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns = ['name', 'roles', 'locations', 'actions'];
  dataSource = new MatTableDataSource<ViewRow>([]);

  private storeNames = new Map(mockStores.map(s => [s.id, s.name]));

  rows = computed<ViewRow[]>(() =>
    mockUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roles: (u.roles ?? []).join(', ') || '—',
      locations: (u.assignments?.map(a => this.storeNames.get(a.locationId) ?? a.locationId) ?? u.locationIds ?? [])
        .map(x => this.storeNames.get(x as any) ?? x).join(', ')
    }))
  );

  currentUser = computed(() => {
    const a: any = this.auth;
    return typeof a.user === 'function' ? a.user() : a.currentUser ?? null;
  });

  // renamed to avoid duplicate identifier
  private isAdminSignal = computed(() => {
    const roles: string[] = this.currentUser()?.roles ?? [];
    return roles?.some(r => /owner|admin/i.test(r));
  });

  isAdmin(): boolean {
    return this.isAdminSignal();
  }

  ngAfterViewInit(): void {
    this.dataSource.data = this.rows();
    this.dataSource.paginator = this.paginator;
  }

  isSelf(email: string): boolean {
    return (this.currentUser()?.email || '').toLowerCase() === (email || '').toLowerCase();
  }

  canEdit(email: string): boolean {
    return this.isAdmin() || this.isSelf(email);
  }

  onEdit(row: ViewRow): void {
    // DEMO: wire to edit drawer/modal later
    console.log('Edit user (demo):', row);
  }

  onDelete(row: ViewRow): void {
    if (!this.isAdmin() || this.isSelf(row.email)) return;
    // DEMO: wire to delete action/effect later
    console.log('Delete user (demo):', row);
  }
}
