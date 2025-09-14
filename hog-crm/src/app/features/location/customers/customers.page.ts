import { Component, ViewChild, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CustomersService, Customer, Pipeline, Stage } from './services/customer.service';
import { CustomerDialogComponent } from './dialog/customer.dialog';
import { ConfirmDialogComponent } from './dialog/confirm-dialog.component';

@Component({
  standalone: true,
  selector: 'hog-location-customers',
  encapsulation: ViewEncapsulation.Emulated,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule
  ],
  styles: [`
    :host { --hog-primary:#1d4ed8; --hog-ink:#0f172a; --badge:#e2e8f0; }

    /* Filters */
    .filters { display:flex; align-items:center; gap:12px; margin:12px 0; flex-wrap:nowrap; overflow-x:auto; padding-bottom:4px; }
    .filters .spacer { flex:1 1 auto; }
    .filters mat-form-field { flex:0 0 260px; min-width:220px; }
    .filters .mat-mdc-text-field-wrapper { background:#fff; }
    :host ::ng-deep .filters .mat-mdc-form-field-appearance-outline .mdc-notched-outline__leading,
    :host ::ng-deep .filters .mat-mdc-form-field-appearance-outline .mdc-notched-outline__notch,
    :host ::ng-deep .filters .mat-mdc-form-field-appearance-outline .mdc-notched-outline__trailing { border-color: var(--hog-primary) !important; }
    :host ::ng-deep .filters .mdc-floating-label { color: var(--hog-primary) !important; }
    :host ::ng-deep .filters .mat-mdc-input-element,
    :host ::ng-deep .filters .mat-mdc-select-value-text { color: var(--hog-ink) !important; }

    /* Table */
    :host ::ng-deep table.mat-mdc-table th.mat-mdc-header-cell {
      color: var(--hog-ink); background:#fff; border-bottom:2px solid var(--hog-primary);
    }
    :host ::ng-deep table.mat-mdc-table td.mat-mdc-cell { color: var(--hog-ink); background:#fff; }
    table { width:100%; margin-top:8px; }

    .notes-ellipsis { max-width: 420px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .badge {
      display:inline-flex; align-items:center; gap:6px;
      padding:2px 8px; border-radius:12px; background:var(--badge); color:var(--hog-ink); font-size:12px;
      border:1px solid rgba(2,6,23,.08);
    }
    .badge .dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
    .dot.sales{background:#3b82f6}.dot.support{background:#10b981}.dot.service{background:#f59e0b}.dot.delivery{background:#ef4444}

    .actions { display:flex; gap:8px; align-items:center; }
    a.name-link { color: var(--hog-primary); text-decoration: underline; cursor: pointer; }
  `],
  template: `
    <h1 class="mat-headline-5">Customers</h1>

    <form [formGroup]="filters" class="filters">
      <mat-form-field appearance="outline" color="primary" floatLabel="always">
        <mat-label>Search</mat-label>
        <input matInput formControlName="q" (keyup)="applyFilters()" placeholder="Name, email, phone">
      </mat-form-field>

      <mat-form-field appearance="outline" color="primary" floatLabel="always">
        <mat-label>Owner</mat-label>
        <mat-select formControlName="owner" (selectionChange)="applyFilters()">
          <mat-option value="">All</mat-option>
          <mat-option *ngFor="let o of owners" [value]="o">{{ o }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" color="primary" floatLabel="always">
        <mat-label>Pipeline</mat-label>
        <mat-select formControlName="pipeline" (selectionChange)="applyFilters()">
          <mat-option value="">All</mat-option>
          <mat-option *ngFor="let p of pipelines" [value]="p">{{ p }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" color="primary" floatLabel="always">
        <mat-label>Stage</mat-label>
        <mat-select formControlName="stage" (selectionChange)="applyFilters()">
          <mat-option value="">All</mat-option>
          <mat-option *ngFor="let s of stages" [value]="s">{{ s }}</mat-option>
        </mat-select>
      </mat-form-field>

      <span class="spacer"></span>
      <button mat-flat-button color="primary" type="button" (click)="create()">New Customer</button>
    </form>

    <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z1">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
        <td mat-cell *matCellDef="let r">
          <a class="name-link" (click)="view(r)">{{ r.name }}</a>
        </td>
      </ng-container>

      <ng-container matColumnDef="contact">
        <th mat-header-cell *matHeaderCellDef>Contact</th>
        <td mat-cell *matCellDef="let r">
          <div>{{ r.email || '—' }}</div>
          <div class="mat-caption">{{ r.phone || '' }}</div>
        </td>
      </ng-container>

      <ng-container matColumnDef="interestedProduct">
        <th mat-header-cell *matHeaderCellDef>Interested</th>
        <td mat-cell *matCellDef="let r">{{ r.interestedProduct || '—' }}</td>
      </ng-container>

      <ng-container matColumnDef="stage">
        <th mat-header-cell *matHeaderCellDef>Stage</th>
        <td mat-cell *matCellDef="let r">{{ r.pipeline || '—' }} • {{ r.stage || '—' }}</td>
      </ng-container>

      <ng-container matColumnDef="owner">
        <th mat-header-cell *matHeaderCellDef>Owner</th>
        <td mat-cell *matCellDef="let r">{{ r.owner || '—' }}</td>
      </ng-container>

      <ng-container matColumnDef="notes">
        <th mat-header-cell *matHeaderCellDef>Notes</th>
        <td mat-cell *matCellDef="let r"><span class="notes-ellipsis">{{ r.notes || '—' }}</span></td>
      </ng-container>

      <!-- Dept badge only -->
      <ng-container matColumnDef="dept">
        <th mat-header-cell *matHeaderCellDef>Dept</th>
        <td mat-cell *matCellDef="let r">
          <span class="badge">
            <span class="dot" [ngClass]="{
              'sales': (r.assignedDept || 'SALES')==='SALES',
              'support': r.assignedDept==='SUPPORT',
              'service': r.assignedDept==='SERVICE',
              'delivery': r.assignedDept==='DELIVERY'
            }"></span>
            {{ r.assignedDept || 'SALES' }}
          </span>
        </td>
      </ng-container>

      <ng-container matColumnDef="createdAt">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
        <td mat-cell *matCellDef="let r">{{ r.createdAt | date:'MMM d' }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let r">
          <div class="actions">
            <button mat-icon-button color="primary" (click)="view(r)" aria-label="View"><mat-icon>visibility</mat-icon></button>
            <button mat-icon-button color="primary" (click)="edit(r)" aria-label="Edit"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button color="warn" (click)="remove(r)" aria-label="Delete"><mat-icon>delete</mat-icon></button>
          </div>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>

    <mat-paginator [pageSize]="10"></mat-paginator>
  `
})
export class CustomersPage {
  private fb = inject(FormBuilder);
  private svc = inject(CustomersService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  owners = ['Alice','Ben','Cara','Dan'];
  pipelines: Pipeline[] = ['Sheds','Barns','Cabins','Furniture','Swing Sets','Trampolines','Playgrounds','Golf Carts','E-Bikes'];
  stages: Stage[] = ['Intake','Qualified','Quoted','Won','Delivered','Lost'];

  filters = this.fb.group({ q: [''], owner: [''], pipeline: [''], stage: [''] });

  cols = ['name','contact','interestedProduct','stage','owner','notes','dept','createdAt','actions'];
  dataSource = new MatTableDataSource<Customer>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() { this.dataSource.data = this.svc.items(); }
  ngAfterViewInit() { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; this.applyFilters(); }

  private get all() { return this.svc.items(); }

  applyFilters() {
    const f = this.filters.value as any;
    this.dataSource.filterPredicate = (c) => {
      const q = (f.q || '').toLowerCase();
      const matchQ = !q || [c.name, c.email, c.phone, c.interestedProduct, c.notes].filter(Boolean)
        .some(v => (v as string).toLowerCase().includes(q));
      const matchOwner = !f.owner || c.owner === f.owner;
      const matchPipe  = !f.pipeline || c.pipeline === f.pipeline;
      const matchStage = !f.stage || c.stage === f.stage;
      return matchQ && matchOwner && matchPipe && matchStage;
    };
    this.dataSource.data = this.all;
    this.dataSource.filter = Math.random().toString();
  }

  create() {
    this.dialog.open(CustomerDialogComponent, {
      width: '860px',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '85vh',     // ensures buttons are visible
      autoFocus: false,
      restoreFocus: true,
      panelClass: 'hog-dialog-panel'
    }).afterClosed().subscribe(res => {
      if (!res) return;
      const created = this.svc.add({
        name: res.name!, email: res.email, phone: res.phone,
        interestedProduct: res.interestedProduct, pipeline: res.pipeline,
        stage: res.stage, owner: res.owner, notes: res.notes, assignedDept: res.assignedDept
      });
      this.applyFilters();
      this.snack.open(`Customer "${created.name}" created`, 'OK', { duration: 2000 });
    });
  }

  edit(row: Customer) {
    this.dialog.open(CustomerDialogComponent, {
      width: '860px',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '85vh',
      autoFocus: false,
      restoreFocus: true,
      data: row,
      panelClass: 'hog-dialog-panel'
    }).afterClosed().subscribe(res => {
      if (!res) return;
      this.svc.update(row.id, res);
      this.applyFilters();
      this.snack.open(`Customer "${row.name}" updated`, 'OK', { duration: 2000 });
    });
  }

  view(row: Customer) {
    import('./customer-view.component').then(m => {
      this.dialog.open(m.CustomerViewComponent, {
        width: '860px', maxWidth: '95vw', height: 'auto', maxHeight: '85vh',
        data: row,
        panelClass: 'hog-view-panel'
      });
    });
  }

  remove(row: Customer) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { title: 'Delete Customer', message: `Delete "${row.name}"? This cannot be undone.` }
    }).afterClosed().subscribe(ok => {
      if (ok) {
        this.svc.remove(row.id);
        this.applyFilters();
        this.snack.open(`Customer "${row.name}" deleted`, 'OK', { duration: 2000 });
      }
    });
  }
}
