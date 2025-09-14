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

type RentalStatus = 'Active'|'Due'|'Overdue'|'Closed';

type CartRental = {
  id: string;
  customerId: string;
  model: string;         // e.g., "EZGO TXT", "Club Car Onward"
  cartId?: string | null; // asset tag / unit #
  status: RentalStatus;
  dailyRate: number;     // USD/day
  dueDate?: string | null; // yyyy-MM-dd
  updatedAt: string;       // ISO
};

@Component({
  standalone: true,
  selector: 'hog-store-rentals',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule
  ],
  template: `
  <div class="page-wrap">
    <!-- Header -->
    <header class="page-hd">
      <h1>Rentals — Golf Carts ({{ storeName }})</h1>
      <div class="hd-actions">
        <button mat-stroked-button color="primary" (click)="prefillNew()">
          <mat-icon>add</mat-icon> New Rental
        </button>
      </div>
    </header>

    <!-- KPIs -->
    <section class="kpis">
      <div class="kpi"><div class="kpi-num">{{ activeCount }}</div><div class="kpi-label">Active</div></div>
      <div class="kpi"><div class="kpi-num">{{ dueSoonCount }}</div><div class="kpi-label">Due in 7d</div></div>
      <div class="kpi warn"><div class="kpi-num">{{ overdueCount }}</div><div class="kpi-label">Overdue</div></div>
      <div class="kpi"><div class="kpi-num">{{ closedCount }}</div><div class="kpi-label">Closed</div></div>
    </section>

    <!-- Filters -->
    <section class="card">
      <div class="filters">
        <mat-form-field appearance="outline" class="q-field">
          <mat-label>Search (tokens: status:/customer:/model:/cart:/#/due:<|>YYYY-MM-DD)</mat-label>
          <input matInput placeholder='e.g., status:Active customer:C102 model:"EZGO" due:<2025-09-30'
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
          <mat-label>Due Window</mat-label>
          <mat-select [value]="filters.controls.dueBucket.value" (selectionChange)="onDueBucket($event.value)">
            <mat-option [value]="''">Any</mat-option>
            <mat-option value="SOON">Due in 7d</mat-option>
            <mat-option value="OVERDUE">Overdue</mat-option>
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
      <table mat-table [dataSource]="dataSource" matSort class="rent-table">
        <!-- Model -->
        <ng-container matColumnDef="model">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Model</th>
          <td mat-cell *matCellDef="let row">
            <div class="subj">{{ row.model }}</div>
            <div class="subtle">#{{ row.id }} • Cust {{ row.customerId }}</div>
          </td>
        </ng-container>

        <!-- Cart ID -->
        <ng-container matColumnDef="cartId">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Unit #</th>
          <td mat-cell *matCellDef="let row">{{ row.cartId || '—' }}</td>
        </ng-container>

        <!-- Status -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
          <td mat-cell *matCellDef="let row">
            <span class="chip"
              [class.ok]="row.status==='Active' || row.status==='Due'"
              [class.warn]="row.status==='Due'"
              [class.danger]="row.status==='Overdue'">
              {{ row.status }}
            </span>
          </td>
        </ng-container>

        <!-- Daily Rate -->
        <ng-container matColumnDef="dailyRate">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Rate</th>
          <td mat-cell *matCellDef="let row">\${{ row.dailyRate | number:'1.0-0' }}/day</td>
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

    <!-- Quick Add (golf carts) -->
    <section class="card editor">
      <div class="editor-hd">
        <h2>Quick Add</h2>
        <button mat-button color="primary" (click)="prefillNew()"><mat-icon>refresh</mat-icon> Reset</button>
      </div>
      <div class="editor-row">
        <mat-form-field appearance="outline" class="grow">
          <mat-label>Model</mat-label>
          <input matInput [formControl]="form.controls.model" placeholder='e.g., "EZGO TXT"'>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Unit #</mat-label>
          <input matInput [formControl]="form.controls.cartId" placeholder="e.g., GC-1027">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Customer ID</mat-label>
          <input matInput [formControl]="form.controls.customerId" placeholder="e.g., C204">
        </mat-form-field>

        <mat-form-field appearance="outline" class="sm">
          <mat-label>Daily Rate</mat-label>
          <input matInput type="number" [formControl]="form.controls.dailyRate">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="form.controls.status">
            <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Due Date</mat-label>
          <input matInput type="date" [formControl]="form.controls.dueDate">
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="save()">
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

    table.rent-table{ width:100%; background:#fff; border-radius:12px; overflow:hidden; border:1px solid var(--border) }
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
    .editor-row{ display:grid; grid-template-columns: 1.8fr 1.1fr 1.1fr .8fr 1fr 1fr auto; gap:12px; align-items:end }
    .grow{ min-width:220px }
    .sm{ max-width:140px }

    :host .mat-mdc-text-field-wrapper{ background:#fff }
    :host .mat-mdc-form-field:hover .mdc-notched-outline__leading,
    :host .mat-mdc-form-field:hover .mdc-notched-outline__trailing,
    :host .mat-mdc-form-field:hover .mdc-notched-outline__notch{ border-color:#cbd5e1 }
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing,
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch{ border-color: var(--primary) }

    tr.mat-mdc-row:hover { background:#f8fafc; cursor:pointer }
  `]
})
export class RentalsPage {
  private fb = inject(FormBuilder);

  storeName = 'Hartville';
  statuses: RentalStatus[] = ['Active','Due','Overdue','Closed'];

  filters = this.fb.group({ q:[''], status:[''], dueBucket:[''] });

  form = this.fb.group({
    model: [''],
    cartId: [''],
    customerId: [''],
    dailyRate: [85], // default day rate
    status: ['Active' as RentalStatus],
    dueDate: [addDaysISO(7)]
  });

  cols = ['model','cartId','status','dailyRate','dueDate','updatedAt'];
  dataSource = new MatTableDataSource<CartRental>([
    { id:'R-4001', customerId:'C102', model:'EZGO TXT 48V', cartId:'GC-1027', status:'Active',  dailyRate:90, dueDate:addDaysISO(5),  updatedAt: agoISO(0.5) },
    { id:'R-4002', customerId:'C221', model:'Club Car Onward', cartId:'GC-1103', status:'Due', dailyRate:95, dueDate:addDaysISO(2),  updatedAt: agoISO(1.0) },
    { id:'R-4003', customerId:'C310', model:'Yamaha Drive2', cartId:'GC-0991', status:'Overdue', dailyRate:85, dueDate:addDaysISO(-3), updatedAt: agoISO(0.2) },
    { id:'R-4004', customerId:'C044', model:'EZGO RXV', cartId:'GC-0877', status:'Closed', dailyRate:80, dueDate:addDaysISO(-15), updatedAt: agoISO(5.0) },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(){
    this.dataSource.paginator=this.paginator;
    this.dataSource.sort=this.sort;

    // Token-aware filtering: status:, customer:, model:, cart:, due:<|>YYYY-MM-DD
    this.dataSource.filterPredicate = (row: CartRental, raw: string) => {
      const f = JSON.parse(raw || '{}') as { q?: string; status?: string; dueBucket?: string; };
      const q = (f.q || '').trim().toLowerCase();

      let tStatus = '', tCustomer = '', tModel = '', tCart = '', dueCmp: '<'|'>'|'' = '', dueVal = '';
      let free = q;

      q.split(/\s+/).forEach(part => {
        const m = part.match(/^(status|customer|model|cart|due):(.*)$/i);
        if (m) {
          const key = m[1].toLowerCase();
          const val = m[2];
          if (key==='status')   tStatus = val.toLowerCase();
          if (key==='customer') tCustomer = val.toLowerCase();
          if (key==='model')    tModel = val.toLowerCase().replace(/^"|"$/g,'');
          if (key==='cart')     tCart = val.toLowerCase().replace(/^#/, '');
          if (key==='due'){
            const d = val.match(/^([<>])(.+)$/);
            if (d){ dueCmp = d[1] as '<'|'>'; dueVal = d[2]; }
          }
          free = free.replace(part,'').trim();
        }
      });

      const freeMatch =
        !free ||
        row.model.toLowerCase().includes(free) ||
        row.customerId.toLowerCase().includes(free) ||
        (row.cartId||'').toLowerCase().includes(free) ||
        row.id.toLowerCase().includes(free);

      const statusMatch =
        (f.status ? row.status === f.status : true) &&
        (tStatus ? row.status.toLowerCase().includes(tStatus) : true);

      const dueBucketMatch = (() => {
        if (!f.dueBucket) return true;
        const today = todayISO();
        const soon = addDaysISO(7);
        if (!row.dueDate) return false;
        if (f.dueBucket==='SOON') return row.dueDate > today && row.dueDate <= soon && row.status !== 'Closed';
        if (f.dueBucket==='OVERDUE') return row.dueDate < today && row.status !== 'Closed';
        return true;
      })();

      const tokenCustomerMatch = !tCustomer || row.customerId.toLowerCase().includes(tCustomer);
      const tokenModelMatch    = !tModel || row.model.toLowerCase().includes(tModel);
      const tokenCartMatch     = !tCart || (row.cartId||'').toLowerCase().includes(tCart);
      const tokenDueMatch      = (!dueCmp || !dueVal || !row.dueDate) ? true : (dueCmp === '<' ? row.dueDate < dueVal : row.dueDate > dueVal);

      return freeMatch && statusMatch && dueBucketMatch && tokenCustomerMatch && tokenModelMatch && tokenCartMatch && tokenDueMatch;
    };

    this.applyFilters();
  }

  // KPIs based on current rows
  private currentRows(){ return this.dataSource.filteredData.length ? this.dataSource.filteredData : this.dataSource.data; }
  get activeCount(){   return this.currentRows().filter(r => r.status==='Active').length; }
  get dueSoonCount(){
    const today = todayISO(); const soon = addDaysISO(7);
    return this.currentRows().filter(r => r.status!=='Closed' && !!r.dueDate && r.dueDate > today && r.dueDate <= soon).length;
  }
  get overdueCount(){
    const today = todayISO();
    return this.currentRows().filter(r => r.status!=='Closed' && !!r.dueDate && r.dueDate < today).length;
  }
  get closedCount(){   return this.currentRows().filter(r => r.status==='Closed').length; }

  // Filter wiring
  onQ(evt: Event){ this.filters.patchValue({ q: (evt.target as HTMLInputElement).value ?? '' }, { emitEvent:false }); this.applyFilters(); }
  onStatus(v: string){ this.filters.patchValue({ status: v }, { emitEvent:false }); this.applyFilters(); }
  onDueBucket(v: string){ this.filters.patchValue({ dueBucket: v }, { emitEvent:false }); this.applyFilters(); }

  applyFilters(){
    const f = this.filters.value;
    this.dataSource.filter = JSON.stringify({ q: f.q || '', status: f.status || '', dueBucket: f.dueBucket || '' });
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  resetFilters(){
    this.filters.reset({ q:'', status:'', dueBucket:'' }, { emitEvent:false });
    this.applyFilters();
  }

  // Quick add (golf cart)
  prefillNew(){
    this.form.reset({ model:'', cartId:'', customerId:'', dailyRate:85, status:'Active', dueDate: addDaysISO(7) });
  }

  save(){
    const v = this.form.value;
    if (!v.model || !v.customerId) return;
    const r: CartRental = {
      id: 'R-' + (4000 + this.dataSource.data.length + 1),
      model: String(v.model),
      cartId: v.cartId ? String(v.cartId) : null,
      customerId: String(v.customerId),
      dailyRate: Number(v.dailyRate ?? 85),
      status: (v.status as RentalStatus) || 'Active',
      dueDate: v.dueDate || null,
      updatedAt: new Date().toISOString(),
    };
    this.dataSource.data = [r, ...this.dataSource.data];
    this.prefillNew();
    this.applyFilters();
  }

  open(row: CartRental){ console.log('open rental', row); /* snackbar('Detail coming soon') */ }

  isOverdue(row: CartRental){ return !!row.dueDate && row.status!=='Closed' && row.dueDate < todayISO(); }
}

// ---- date helpers
function todayISO(): string {
  const d = new Date(); d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}
function addDaysISO(days: number): string {
  const d = new Date(); d.setDate(d.getDate()+days); d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}
function agoISO(days: number): string {
  const d = new Date(); d.setDate(d.getDate()-Math.floor(days));
  return d.toISOString();
}
