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

type DeliveryJob = {
  id: string;
  customerId: string;
  window: 'AM' | 'PM';
  status: 'Scheduled' | 'Loaded' | 'In Route' | 'Complete' | 'Issue';
  driver?: string | null;
  dateISO: string;     // yyyy-MM-dd
  updatedAt: string;   // ISO
};

@Component({
  standalone: true,
  selector: 'hog-store-delivery',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule
  ],
  template: `
  <div class="page-wrap">
    <!-- Header -->
    <header class="page-hd">
      <h1>Delivery — {{ storeName }}</h1>
      <div class="hd-actions">
        <button mat-stroked-button color="primary" (click)="prefillNew()">
          <mat-icon>add</mat-icon> New Job
        </button>
      </div>
    </header>

    <!-- KPIs -->
    <section class="kpis">
      <div class="kpi">
        <div class="kpi-num">{{ scheduledToday }}</div>
        <div class="kpi-label">Scheduled Today</div>
      </div>
      <div class="kpi">
        <div class="kpi-num">{{ loadedCount }}</div>
        <div class="kpi-label">Loaded</div>
      </div>
      <div class="kpi">
        <div class="kpi-num">{{ inRouteCount }}</div>
        <div class="kpi-label">In Route</div>
      </div>
      <div class="kpi warn">
        <div class="kpi-num">{{ issueCount }}</div>
        <div class="kpi-label">Issues</div>
      </div>
    </section>

    <!-- Filters -->
    <section class="card">
      <div class="filters">
        <mat-form-field appearance="outline" class="q-field">
          <mat-label>Search (tokens: status:/driver:/date:/window:AM|PM)</mat-label>
          <input matInput placeholder='e.g., status:"In Route" driver:Sam date:2025-09-15'
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
          <mat-label>Driver</mat-label>
          <mat-select [value]="filters.controls.driver.value" (selectionChange)="onDriver($event.value)">
            <mat-option [value]="''">Anyone</mat-option>
            <mat-option *ngFor="let d of drivers" [value]="d">{{ d }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Window</mat-label>
          <mat-select [value]="filters.controls.window.value" (selectionChange)="onWindow($event.value)">
            <mat-option [value]="''">All</mat-option>
            <mat-option value="AM">AM</mat-option>
            <mat-option value="PM">PM</mat-option>
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
      <table mat-table [dataSource]="dataSource" matSort class="deliv-table">
        <!-- Customer -->
        <ng-container matColumnDef="customerId">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Customer</th>
          <td mat-cell *matCellDef="let row">
            <div class="subj">Cust {{ row.customerId }}</div>
            <div class="subtle">#{{ row.id }}</div>
          </td>
        </ng-container>

        <!-- Date -->
        <ng-container matColumnDef="dateISO">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
          <td mat-cell *matCellDef="let row">{{ row.dateISO }}</td>
        </ng-container>

        <!-- Window -->
        <ng-container matColumnDef="window">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Window</th>
          <td mat-cell *matCellDef="let row">
            <span class="chip" [class.ok]="row.window==='AM'" [class.warn]="row.window==='PM'">{{ row.window }}</span>
          </td>
        </ng-container>

        <!-- Status -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
          <td mat-cell *matCellDef="let row">
            <span class="chip"
              [class.ok]="row.status==='Scheduled' || row.status==='Loaded'"
              [class.warn]="row.status==='In Route'"
              [class.danger]="row.status==='Issue'">
              {{ row.status }}
            </span>
          </td>
        </ng-container>

        <!-- Driver -->
        <ng-container matColumnDef="driver">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Driver</th>
          <td mat-cell *matCellDef="let row">{{ row.driver || '—' }}</td>
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
        <mat-form-field appearance="outline">
          <mat-label>Customer ID</mat-label>
          <input matInput [formControl]="jobForm.controls.customerId" placeholder="e.g., C1024">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput type="date" [formControl]="jobForm.controls.dateISO">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Window</mat-label>
          <mat-select [formControl]="jobForm.controls.window">
            <mat-option value="AM">AM</mat-option>
            <mat-option value="PM">PM</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="jobForm.controls.status">
            <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Driver</mat-label>
          <mat-select [formControl]="jobForm.controls.driver">
            <mat-option [value]="null">Unassigned</mat-option>
            <mat-option *ngFor="let d of drivers" [value]="d">{{ d }}</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="saveJob()">
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

    table.deliv-table{ width:100%; background:#fff; border-radius:12px; overflow:hidden; border:1px solid var(--border) }
    .table-header th{ background: var(--primary); color:#fff; font-weight:700 }
    td{ color:var(--slate) }
    .subj{ font-weight:600; color:var(--slate) }
    .subtle{ color:var(--muted); font-size:12px }

    .chip{ padding:2px 8px; border-radius:999px; font-size:12px; font-weight:700; border:1px solid var(--border); display:inline-block }
    .chip.ok{ background:#eef2ff; color:#3730a3; border-color:#c7d2fe }
    .chip.warn{ background:#fff7ed; color:#9a3412; border-color:#fed7aa }
    .chip.danger{ background:#fef2f2; color:#991b1b; border-color:#fecaca }

    .editor{ padding:12px }
    .editor-hd{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px }
    .editor-row{ display:grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto; gap:12px; align-items:end }

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
export class DeliveryPage {
  private fb = inject(FormBuilder);

  storeName = 'Hartville';

  statuses: DeliveryJob['status'][] = ['Scheduled','Loaded','In Route','Complete','Issue'];
  drivers = ['Sam','Alex','Jamie','Riley','Casey'];

  filters = this.fb.group({ q:[''], status:[''], driver:[''], window:[''] });

  jobForm = this.fb.group({
    customerId: [''],
    dateISO: [todayISO()],
    window: ['AM' as DeliveryJob['window']],
    status: ['Scheduled' as DeliveryJob['status']],
    driver: [null as string | null]
  });

  cols = ['customerId','dateISO','window','status','driver','updatedAt'];
  dataSource = new MatTableDataSource<DeliveryJob>([
    { id:'D-2001', customerId:'C101', window:'AM', status:'Scheduled', dateISO: todayISO(), driver:'Sam',   updatedAt: agoISO(0.5) },
    { id:'D-2002', customerId:'C225', window:'PM', status:'Loaded',    dateISO: todayISO(), driver:'Alex',  updatedAt: agoISO(0.2) },
    { id:'D-2003', customerId:'C310', window:'AM', status:'In Route',  dateISO: todayISO(), driver:'Jamie', updatedAt: agoISO(0.1) },
    { id:'D-2004', customerId:'C044', window:'PM', status:'Complete',  dateISO: todayISO(-1), driver:'Riley', updatedAt: agoISO(1.5) },
    { id:'D-2005', customerId:'C512', window:'AM', status:'Issue',     dateISO: todayISO(), driver:'Casey', updatedAt: agoISO(0.3) },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(){
    this.dataSource.paginator=this.paginator;
    this.dataSource.sort=this.sort;

    // token-aware filter: status:, driver:, date:, window:
    this.dataSource.filterPredicate = (row: DeliveryJob, raw: string) => {
      const f = JSON.parse(raw || '{}') as { q?: string; status?: string; driver?: string; window?: string; };
      const q = (f.q || '').trim().toLowerCase();
      let tStatus = '', tDriver = '', tDate = '', tWindow = '';
      let free = q;

      q.split(/\s+/).forEach(part => {
        const m = part.match(/^(status|driver|date|window):(.*)$/i);
        if (m) {
          const key = m[1].toLowerCase();
          const val = m[2];
          if (key==='status')  tStatus = val.toLowerCase();
          if (key==='driver')  tDriver = val.toLowerCase();
          if (key==='date')    tDate   = val; // expect yyyy-MM-dd
          if (key==='window')  tWindow = val.toUpperCase();
          free = free.replace(part,'').trim();
        }
      });

      const freeMatch = !free || row.customerId.toLowerCase().includes(free) || row.id.toLowerCase().includes(free);

      const statusMatch =
        (f.status ? row.status === f.status : true) &&
        (tStatus ? row.status.toLowerCase().includes(tStatus) : true);

      const driverMatch =
        (f.driver ? (row.driver||'').toLowerCase() === f.driver.toLowerCase() : true) &&
        (tDriver ? (row.driver||'').toLowerCase().includes(tDriver) : true);

      const windowMatch =
        (f.window ? row.window === f.window : true) &&
        (tWindow ? row.window === (tWindow as DeliveryJob['window']) : true);

      const dateMatch = !tDate || row.dateISO === tDate;

      return freeMatch && statusMatch && driverMatch && windowMatch && dateMatch;
    };

    this.applyFilters();
  }

  // KPIs (based on current filtered rows)
  private currentRows(){
    return this.dataSource.filteredData.length ? this.dataSource.filteredData : this.dataSource.data;
  }
  get scheduledToday(){ return this.currentRows().filter(j => j.status==='Scheduled' && j.dateISO===todayISO()).length; }
  get loadedCount(){     return this.currentRows().filter(j => j.status==='Loaded').length; }
  get inRouteCount(){    return this.currentRows().filter(j => j.status==='In Route').length; }
  get issueCount(){      return this.currentRows().filter(j => j.status==='Issue').length; }

  // Filters wiring
  onQ(evt: Event){
    const v = (evt.target as HTMLInputElement).value ?? '';
    this.filters.patchValue({ q: v }, { emitEvent:false });
    this.applyFilters();
  }
  onStatus(v: string){ this.filters.patchValue({ status: v }, { emitEvent:false }); this.applyFilters(); }
  onDriver(v: string){ this.filters.patchValue({ driver: v }, { emitEvent:false }); this.applyFilters(); }
  onWindow(v: string){ this.filters.patchValue({ window: v }, { emitEvent:false }); this.applyFilters(); }

  applyFilters(){
    const f = this.filters.value;
    this.dataSource.filter = JSON.stringify({
      q: f.q || '', status: f.status || '', driver: f.driver || '', window: f.window || ''
    });
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  resetFilters(){
    this.filters.reset({ q:'', status:'', driver:'', window:'' }, { emitEvent:false });
    this.applyFilters();
  }

  prefillNew(){
    this.jobForm.reset({
      customerId:'', dateISO: todayISO(), window:'AM', status:'Scheduled', driver: null
    });
  }

  saveJob(){
    const v = this.jobForm.value;
    if (!v.customerId) return;
    const j: DeliveryJob = {
      id: 'D-' + (2000 + this.dataSource.data.length + 1),
      customerId: String(v.customerId),
      dateISO: v.dateISO || todayISO(),
      window: (v.window as DeliveryJob['window']) || 'AM',
      status: (v.status as DeliveryJob['status']) || 'Scheduled',
      driver: v.driver ?? null,
      updatedAt: new Date().toISOString()
    };
    this.dataSource.data = [j, ...this.dataSource.data];
    this.prefillNew();
    this.applyFilters();
  }

  open(row: DeliveryJob){
    console.log('open job', row);
    // snackbar('Detail coming soon');
  }
}

// ---- date helpers
function todayISO(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate()+offsetDays);
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}
function agoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate()-Math.floor(days));
  return d.toISOString();
}
