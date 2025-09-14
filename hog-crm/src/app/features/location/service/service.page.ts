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

type ServiceOrder = {
  id: string;
  customerId: string;
  subject: string;
  status: 'Open' | 'In Progress' | 'Closed';
  assignedTo?: string | null;
  dueDate?: string | null;   // ISO yyyy-MM-dd (for simplicity)
  updatedAt: string;         // ISO
};

@Component({
  standalone: true,
  selector: 'hog-store-service',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule
  ],
  template: `
  <div class="page-wrap">
    <!-- Header -->
    <header class="page-hd">
      <h1>Service — {{ storeName }}</h1>
      <div class="hd-actions">
        <button mat-stroked-button color="primary" (click)="prefillNew()">
          <mat-icon>add</mat-icon> New Ticket
        </button>
      </div>
    </header>

    <!-- KPIs -->
    <section class="kpis">
      <div class="kpi">
        <div class="kpi-num">{{ openCount }}</div>
        <div class="kpi-label">Open</div>
      </div>
      <div class="kpi">
        <div class="kpi-num">{{ inProgressCount }}</div>
        <div class="kpi-label">In Progress</div>
      </div>
      <div class="kpi">
        <div class="kpi-num">{{ closedCount }}</div>
        <div class="kpi-label">Closed (30d)</div>
      </div>
      <div class="kpi warn">
        <div class="kpi-num">{{ overdueCount }}</div>
        <div class="kpi-label">Overdue</div>
      </div>
    </section>

    <!-- Filters -->
    <section class="card">
      <div class="filters">
        <mat-form-field appearance="outline" class="q-field">
          <mat-label>Search (e.g., "status:Open assigned:Sam due:<2025-09-20")</mat-label>
          <input matInput placeholder='subject, customer… + tokens status:/assigned:/due:</>'
                 [value]="filters.controls.q.value" (input)="onQ($event)">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [value]="filters.controls.status.value" (selectionChange)="onStatus($event.value)">
            <mat-option [value]="''">All</mat-option>
            <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Assignee</mat-label>
          <mat-select [value]="filters.controls.assigned.value" (selectionChange)="onAssigned($event.value)">
            <mat-option [value]="''">Anyone</mat-option>
            <mat-option *ngFor="let a of assignees" [value]="a">{{ a }}</mat-option>
          </mat-select>
        </mat-form-field>

        <span class="spacer"></span>

        <button mat-stroked-button color="primary" (click)="resetFilters()">
          <mat-icon>clear</mat-icon> Clear
        </button>
      </div>
    </section>

    <!-- Table -->
    <section class="card">
      <table mat-table [dataSource]="dataSource" matSort class="svc-table">
        <!-- Subject -->
        <ng-container matColumnDef="subject">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Subject</th>
          <td mat-cell *matCellDef="let row">
            <div class="subj">{{ row.subject }}</div>
            <div class="subtle">#{{ row.id }} • Cust {{ row.customerId }}</div>
          </td>
        </ng-container>

        <!-- Status -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
          <td mat-cell *matCellDef="let row">
            <span class="chip"
              [class.ok]="row.status==='Open'"
              [class.warn]="row.status==='In Progress'"
              [class.danger]="row.status==='Closed' && isOverdue(row)"
            >{{ row.status }}</span>
          </td>
        </ng-container>

        <!-- Assigned -->
        <ng-container matColumnDef="assignedTo">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Assigned</th>
          <td mat-cell *matCellDef="let row">{{ row.assignedTo || '—' }}</td>
        </ng-container>

        <!-- Due -->
        <ng-container matColumnDef="dueDate">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Due</th>
          <td mat-cell *matCellDef="let row">
            <span [class.overdue]="isOverdue(row)">{{ row.dueDate || '—' }}</span>
          </td>
        </ng-container>

        <!-- Updated -->
        <ng-container matColumnDef="updatedAt">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Updated</th>
          <td mat-cell *matCellDef="let row">{{ row.updatedAt | date:'MMM d, y, h:mm a' }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="cols" class="table-header"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;" (click)="open(row)"></tr>
      </table>

      <mat-paginator [pageSize]="10" [pageSizeOptions]="[10,25,50]"></mat-paginator>
    </section>

    <!-- Quick Add (stub) -->
    <section class="card editor">
      <div class="editor-hd">
        <h2>Quick Add</h2>
        <button mat-button color="primary" (click)="prefillNew()"><mat-icon>refresh</mat-icon> Reset</button>
      </div>
      <div class="editor-row">
        <mat-form-field appearance="outline" class="grow">
          <mat-label>Subject</mat-label>
          <input matInput [formControl]="ticketForm.controls.subject">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Customer ID</mat-label>
          <input matInput [formControl]="ticketForm.controls.customerId" placeholder="e.g., C1024">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="ticketForm.controls.status">
            <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Assigned To</mat-label>
          <mat-select [formControl]="ticketForm.controls.assignedTo">
            <mat-option [value]="null">Unassigned</mat-option>
            <mat-option *ngFor="let a of assignees" [value]="a">{{ a }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Due Date</mat-label>
          <input matInput type="date" [formControl]="ticketForm.controls.dueDate">
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="saveTicket()">
          <mat-icon>save</mat-icon> Save
        </button>
      </div>
    </section>
  </div>
  `,
  styles: [`
    :host{ --primary:#2563eb; --slate:#0f172a; --muted:#64748b; --card:#fff; --border:#e2e8f0; --bg:#f6f7fb }
    .page-wrap{ padding:16px; background:var(--bg); color:var(--slate) }
    .page-hd{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px }
    .page-hd h1{ font-size:22px; font-weight:700; color:var(--slate); margin:0 }

    .kpis{ display:grid; gap:12px; grid-template-columns: repeat(4, minmax(0,1fr)); margin-bottom:12px }
    .kpi{ background:var(--card); border:1px solid var(--border); border-radius:14px; padding:16px }
    .kpi .kpi-num{ font-size:24px; font-weight:800; color:var(--slate) }
    .kpi .kpi-label{ color:var(--muted); font-weight:600 }
    .kpi.warn .kpi-num{ color:#b91c1c }

    .card{ background:var(--card); border:1px solid var(--border); border-radius:12px; padding:12px; margin-bottom:12px }

    .filters{ display:flex; flex-wrap:wrap; gap:12px; align-items:center }
    .filters .q-field{ flex:1 1 480px; min-width:260px }
    .filters .spacer{ flex:1 1 auto }

    table.svc-table{ width:100%; background:#fff; border-radius:12px; overflow:hidden; border:1px solid var(--border) }
    .table-header th{ background: var(--primary); color:#fff; font-weight:700 }
    td{ color:var(--slate) }
    .subj{ font-weight:600; color:var(--slate) }
    .subtle{ color:var(--muted); font-size:12px }

    .chip{ padding:2px 8px; border-radius:999px; font-size:12px; font-weight:700; border:1px solid var(--border); display:inline-block }
    .chip.ok{ background:#eef2ff; color:#3730a3; border-color:#c7d2fe }
    .chip.warn{ background:#fff7ed; color:#9a3412; border-color:#fed7aa }
    .chip.danger{ background:#fef2f2; color:#991b1b; border-color:#fecaca }
    .overdue{ color:#b91c1c; font-weight:700 }

    .editor{ padding:12px }
    .editor-hd{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px }
    .editor-row{ display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto; gap:12px; align-items:end }
    .grow{ min-width:220px }

    /* Inputs outline behavior */
    :host .mat-mdc-text-field-wrapper{ background:#fff }
    :host .mat-mdc-form-field:hover .mdc-notched-outline__leading,
    :host .mat-mdc-form-field:hover .mdc-notched-outline__trailing,
    :host .mat-mdc-form-field:hover .mdc-notched-outline__notch{ border-color:#cbd5e1 }
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing,
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch{ border-color: var(--primary) }

    /* Row hover */
    tr.mat-mdc-row:hover { background:#f8fafc; cursor:pointer }
  `]
})
export class ServicePage {
  private fb = inject(FormBuilder);

  storeName = 'Hartville';

  statuses: ServiceOrder['status'][] = ['Open','In Progress','Closed'];
  assignees = ['Sam','Alex','Casey','Jordan'];

  filters = this.fb.group({ q:[''], status:[''], assigned:[''] });

  ticketForm = this.fb.group({
    subject: [''],
    customerId: [''],
    status: ['Open' as ServiceOrder['status']],
    assignedTo: [null as string | null],
    dueDate: [null as string | null]
  });

  cols = ['subject','status','assignedTo','dueDate','updatedAt'];
  dataSource = new MatTableDataSource<ServiceOrder>([
    { id:'S-1001', customerId:'C101', subject:'Shed door misaligned', status:'Open',        assignedTo:'Sam',   dueDate: nextISO(2),  updatedAt: agoISO(1) },
    { id:'S-1002', customerId:'C225', subject:'Cart battery check',   status:'In Progress', assignedTo:'Alex',  dueDate: nextISO(1),  updatedAt: agoISO(3) },
    { id:'S-1003', customerId:'C310', subject:'Cabin leak inspect',   status:'Open',        assignedTo:null,    dueDate: nextISO(5),  updatedAt: agoISO(2) },
    { id:'S-1004', customerId:'C044', subject:'Playground bolts',     status:'Closed',      assignedTo:'Casey', dueDate: agoISO(5),   updatedAt: agoISO(4) },
    { id:'S-1005', customerId:'C512', subject:'Bike brake squeal',    status:'In Progress', assignedTo:'Jordan',dueDate: agoISO(1),   updatedAt: agoISO(0.5) },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(){
    this.dataSource.paginator=this.paginator;
    this.dataSource.sort=this.sort;

    // Custom predicate supporting tokens: status:, assigned:, due:< or > yyyy-MM-dd
    this.dataSource.filterPredicate = (row: ServiceOrder, raw: string) => {
      const f = JSON.parse(raw || '{}') as { q?: string; status?: string; assigned?: string; };
      const q = (f.q || '').trim().toLowerCase();

      // Parse tokens from free-text
      let tStatus = '', tAssigned = '', tDueCmp: '<'|'>'|'' = '', tDueDate = '';
      let free = q;
      q.split(/\s+/).forEach(part => {
        const m = part.match(/^(status|assigned|due):(.*)$/i);
        if (m) {
          const key = m[1].toLowerCase();
          const val = m[2];
          if (key==='status')  tStatus = val.toLowerCase();
          if (key==='assigned') tAssigned = val.toLowerCase();
          if (key==='due') {
            const md = val.match(/^([<>])(.+)$/);
            if (md) { tDueCmp = md[1] as '<'|'>'; tDueDate = md[2]; }
          }
          free = free.replace(part,'').trim();
        }
      });

      const freeMatch = !free || row.subject.toLowerCase().includes(free) || row.customerId.toLowerCase().includes(free);

      const statusMatch =
        (f.status ? row.status === f.status : true) &&
        (tStatus ? row.status.toLowerCase().includes(tStatus) : true);

      const assignedMatch =
        (f.assigned ? (row.assignedTo||'').toLowerCase() === f.assigned.toLowerCase() : true) &&
        (tAssigned ? (row.assignedTo||'').toLowerCase().includes(tAssigned) : true);

      const dueMatch = (() => {
        if (!tDueCmp || !tDueDate) return true;
        if (!row.dueDate) return false;
        return tDueCmp === '<'
          ? row.dueDate < tDueDate
          : row.dueDate > tDueDate;
      })();

      return freeMatch && statusMatch && assignedMatch && dueMatch;
    };

    this.applyFilters();
  }

  // KPIs (reflect filtered rows)
  private currentRows(){
    return this.dataSource.filteredData.length ? this.dataSource.filteredData : this.dataSource.data;
  }
  get openCount(){        return this.currentRows().filter(t => t.status==='Open').length; }
  get inProgressCount(){  return this.currentRows().filter(t => t.status==='In Progress').length; }
  get closedCount(){      return this.currentRows().filter(t => t.status==='Closed').length; }
  get overdueCount(){
    const today = todayISO();
    return this.currentRows().filter(t =>
      (t.status==='Open' || t.status==='In Progress') &&
      !!t.dueDate && t.dueDate < today
    ).length;
  }

  // Filters wiring
  onQ(evt: Event){
    const v = (evt.target as HTMLInputElement).value ?? '';
    this.filters.patchValue({ q: v }, { emitEvent:false });
    this.applyFilters();
  }
  onStatus(v: string){ this.filters.patchValue({ status: v }, { emitEvent:false }); this.applyFilters(); }
  onAssigned(v: string){ this.filters.patchValue({ assigned: v }, { emitEvent:false }); this.applyFilters(); }

  applyFilters(){
    const f = this.filters.value;
    this.dataSource.filter = JSON.stringify({
      q: f.q || '', status: f.status || '', assigned: f.assigned || ''
    });
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  resetFilters(){
    this.filters.reset({ q:'', status:'', assigned:'' }, { emitEvent:false });
    this.applyFilters();
  }

  prefillNew(){
    this.ticketForm.reset({ subject:'', customerId:'', status:'Open', assignedTo:null, dueDate: null });
  }

  saveTicket(){
    const v = this.ticketForm.value;
    if (!v.subject || !v.customerId) return;
    const t: ServiceOrder = {
      id: 'S-' + (1000 + this.dataSource.data.length + 1),
      subject: String(v.subject),
      customerId: String(v.customerId),
      status: v.status as ServiceOrder['status'],
      assignedTo: v.assignedTo ?? null,
      dueDate: v.dueDate ?? null,
      updatedAt: new Date().toISOString()
    };
    this.dataSource.data = [t, ...this.dataSource.data];
    this.prefillNew();
    this.applyFilters();
  }

  open(row: ServiceOrder){
    console.log('open ticket', row);
    // snackbar('Detail coming soon');
  }

  // Utilities
  isOverdue(row: ServiceOrder){
    if (!row.dueDate) return false;
    const today = todayISO();
    return (row.status==='Open' || row.status==='In Progress') && row.dueDate < today;
  }
}

// ---- tiny date helpers
function todayISO(): string {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}
function nextISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate()+days);
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}
function agoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate()-Math.floor(days));
  return d.toISOString();
}
