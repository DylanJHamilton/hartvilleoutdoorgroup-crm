import { Component, ViewChild, inject } from '@angular/core';
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

import { CustomersService, Customer, Pipeline, Stage } from './customer.service';
import { CustomerDialogComponent } from './customer.dialog';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Component({
  standalone: true,
  selector: 'hog-store-customers',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule
  ],
  styles: [`
    .filters { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin:12px 0; }
    .filters .spacer { flex: 1 1 auto; }
    mat-form-field { min-width: 180px; }
    table { width: 100%; margin-top: 8px; }
    .actions { display:flex; gap:8px; }
  `],
  template: `
    <h1 class="mat-headline-5">Customers</h1>

    <form [formGroup]="filters" class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Search</mat-label>
        <input matInput formControlName="q" (keyup)="applyFilters()" placeholder="Name, email, phone">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Owner</mat-label>
        <mat-select formControlName="owner" (selectionChange)="applyFilters()">
          <mat-option value="">All</mat-option>
          <mat-option *ngFor="let o of owners" [value]="o">{{ o }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Pipeline</mat-label>
        <mat-select formControlName="pipeline" (selectionChange)="applyFilters()">
          <mat-option value="">All</mat-option>
          <mat-option *ngFor="let p of pipelines" [value]="p">{{ p }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
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
        <td mat-cell *matCellDef="let r">{{ r.name }}</td>
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

      <ng-container matColumnDef="pipeline">
        <th mat-header-cell *matHeaderCellDef>Pipeline</th>
        <td mat-cell *matCellDef="let r">{{ r.pipeline }}</td>
      </ng-container>

      <ng-container matColumnDef="stage">
        <th mat-header-cell *matHeaderCellDef>Stage</th>
        <td mat-cell *matCellDef="let r">{{ r.stage }}</td>
      </ng-container>

      <ng-container matColumnDef="owner">
        <th mat-header-cell *matHeaderCellDef>Owner</th>
        <td mat-cell *matCellDef="let r">{{ r.owner }}</td>
      </ng-container>

      <ng-container matColumnDef="createdAt">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
        <td mat-cell *matCellDef="let r">{{ r.createdAt | date:'MMM d' }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let r">
          <div class="actions">
            <button mat-icon-button color="primary" (click)="edit(r)" aria-label="Edit">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="remove(r)" aria-label="Delete">
              <mat-icon>delete</mat-icon>
            </button>
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

  owners = ['Alice','Ben','Cara','Dan']; // TODO: drive from users API
  pipelines: Pipeline[] = ['Sheds','Barns','Cabins','Furniture','Swing Sets','Trampolines','Playgrounds','Golf Carts','E-Bikes'];
  stages: Stage[] = ['Intake','Qualified','Quoted','Won','Delivered','Lost'];

  filters = this.fb.group({
    q: [''], owner: [''], pipeline: [''], stage: ['']
  });

  cols = ['name','contact','interestedProduct','pipeline','stage','owner','createdAt','actions'];
  dataSource = new MatTableDataSource<Customer>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    // feed initial data
    this.dataSource.data = this.svc.items();
    // react to future changes (signals → manual subscription)
    const ro = new MutationObserver(() => {}); // noop; signal is sync
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.applyFilters();
  }

  private get all() { return this.svc.items(); }

  applyFilters() {
    const f = this.filters.value;
    this.dataSource.filterPredicate = (c) => {
      const q = (f.q || '').toLowerCase();
      const matchQ = !q || [c.name, c.email, c.phone, c.interestedProduct]
        .filter(Boolean).some(v => (v as string).toLowerCase().includes(q));
      const matchOwner = !f.owner || c.owner === f.owner;
      const matchPipe  = !f.pipeline || c.pipeline === f.pipeline;
      const matchStage = !f.stage || c.stage === f.stage;
      return matchQ && matchOwner && matchPipe && matchStage;
    };
    // refresh from service and trigger filter
    this.dataSource.data = this.all;
    this.dataSource.filter = Math.random().toString();
  }

  create() {
    this.dialog.open(CustomerDialogComponent, { width: '720px' })
      .afterClosed().subscribe(res => {
        if (!res) return;
        const created = this.svc.add({
          name: res.name!, email: res.email, phone: res.phone,
          interestedProduct: res.interestedProduct, pipeline: res.pipeline,
          stage: res.stage, owner: res.owner, notes: res.notes
        });
        this.applyFilters();
        this.snack.open(`Customer "${created.name}" created`, 'OK', { duration: 2000 });
      });
  }

  edit(row: Customer) {
    this.dialog.open(CustomerDialogComponent, { width: '720px', data: row })
      .afterClosed().subscribe(res => {
        if (!res) return;
        this.svc.update(row.id, res);
        this.applyFilters();
        this.snack.open(`Customer "${row.name}" updated`, 'OK', { duration: 2000 });
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
