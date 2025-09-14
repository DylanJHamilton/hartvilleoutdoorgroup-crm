// src/app/features/location/reports/reports.page.ts
import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../core/auth/auth.service';
import { rolesForLocation } from '../../../core/auth/roles.util';

type StoreReportRow = { id:string; sku:string; name:string; dept:string; margin:number; revenue:number; updatedAt:string };
type MgmtReportRow  = { id:string; owner:string; dept:string; kpi:string; value:number; trend:'up'|'down'|'flat'; updatedAt:string };

@Component({
  standalone: true,
  selector: 'hog-location-reports',
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatTabsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatMenuModule, MatTooltipModule, MatDividerModule
  ],
  template: `
  <div class="page-wrap">
    <header class="page-hd">
      <h1>Reports — {{ storeName }}</h1>

      <!-- Custom Views -->
      <div class="views">
        <button mat-stroked-button [matMenuTriggerFor]="viewsMenu">
          <mat-icon>visibility</mat-icon><span>Custom Views</span>
        </button>
        <mat-menu #viewsMenu="matMenu">
          <ng-container *ngIf="savedViewNames().length; else noViews">
            <button mat-menu-item *ngFor="let n of savedViewNames()" (click)="applyView(n)">
              <mat-icon>visibility</mat-icon><span>{{ n }}</span>
            </button>
            <mat-divider></mat-divider>
          </ng-container>
          <ng-template #noViews>
            <button mat-menu-item disabled><mat-icon>info</mat-icon><span>No saved views</span></button>
            <mat-divider></mat-divider>
          </ng-template>
          <button mat-menu-item (click)="saveCurrentView()"><mat-icon>save</mat-icon><span>Save current view…</span></button>
          <button mat-menu-item (click)="deleteView()"><mat-icon>delete</mat-icon><span>Delete a view…</span></button>
        </mat-menu>
      </div>
    </header>

    <!-- Permission gate -->
    <section *ngIf="!canView()" class="card blocked">
      <mat-icon>lock</mat-icon>
      <div>
        <h2>Restricted</h2>
        <p>Reports are only available to Managers, Admins, and Owners.</p>
      </div>
    </section>

    <ng-container *ngIf="canView()">
      <mat-tab-group [(selectedIndex)]="tabIndex">
        <!-- Management tab — visible to MGR/ADMIN/OWNER -->
        <mat-tab label="Management">
          <section class="kpis">
            <div class="kpi"><div class="kpi-num">{{ mgmtTotal() | number:'1.0-0' }}</div><div class="kpi-label">KPI Total</div></div>
            <div class="kpi"><div class="kpi-num">{{ mgmtUps() }}</div><div class="kpi-label">Trending Up</div></div>
            <div class="kpi warn"><div class="kpi-num">{{ mgmtDowns() }}</div><div class="kpi-label">Trending Down</div></div>
            <div class="kpi"><div class="kpi-num">{{ mgmtFlats() }}</div><div class="kpi-label">Flat</div></div>
          </section>

          <section class="card">
            <div class="filters">
              <mat-form-field appearance="outline" class="q-field">
                <mat-label>Search (tokens: dept:/owner:/kpi:)</mat-label>
                <input matInput [value]="mgmtFilters.controls.q.value" (input)="onMgmtQ($event)" placeholder='e.g., dept:Service kpi:"CSAT"'>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Department</mat-label>
                <mat-select class="action" [value]="mgmtFilters.controls.dept.value" (selectionChange)="mgmtOnDept($event.value)">
                  <mat-option [value]="''">All</mat-option>
                  <mat-option *ngFor="let d of depts" [value]="d">{{ d }}</mat-option>
                </mat-select>
              </mat-form-field>

              <span class="spacer"></span>

              <button mat-stroked-button color="primary" (click)="mgmtReset()">
                <mat-icon>clear</mat-icon> Clear
              </button>
            </div>
          </section>

          <section class="card">
            <table mat-table [dataSource]="mgmtDS" matSort #mgmtSort="matSort" class="rep-table">
              <ng-container matColumnDef="owner">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Owner</th>
                <td mat-cell *matCellDef="let r">{{ r.owner }}</td>
              </ng-container>

              <ng-container matColumnDef="dept">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Dept</th>
                <td mat-cell *matCellDef="let r">{{ r.dept }}</td>
              </ng-container>

              <ng-container matColumnDef="kpi">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>KPI</th>
                <td mat-cell *matCellDef="let r">{{ r.kpi }}</td>
              </ng-container>

              <ng-container matColumnDef="value">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Value</th>
                <td mat-cell *matCellDef="let r">{{ r.value | number:'1.0-0' }}</td>
              </ng-container>

              <ng-container matColumnDef="trend">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Trend</th>
                <td mat-cell *matCellDef="let r">
                  <span class="chip"
                    [class.ok]="r.trend==='up'"
                    [class.warn]="r.trend==='flat'"
                    [class.danger]="r.trend==='down'">
                    {{ r.trend }}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="mgmtCols" class="table-header"></tr>
              <tr mat-row *matRowDef="let row; columns: mgmtCols;"></tr>
            </table>
            <mat-paginator [pageSize]="10" [pageSizeOptions]="[10,25,50]" #mgmtPaginator></mat-paginator>
          </section>
        </mat-tab>

        <!-- Store tab — Admin/Owner only -->
        <mat-tab *ngIf="canSeeStoreTab()" label="Store">
          <section class="kpis">
            <div class="kpi"><div class="kpi-num">\${{ storeRevenue() | number:'1.0-0' }}</div><div class="kpi-label">Revenue</div></div>
            <div class="kpi"><div class="kpi-num">{{ storeItems() }}</div><div class="kpi-label">SKUs</div></div>
            <div class="kpi"><div class="kpi-num">{{ storeAvgMargin() }}%</div><div class="kpi-label">Avg Margin</div></div>
            <div class="kpi warn"><div class="kpi-num">{{ storeLowMargin() }}</div><div class="kpi-label">Low-Margin SKUs</div></div>
          </section>

          <section class="card">
            <div class="filters">
              <mat-form-field appearance="outline" class="q-field">
                <mat-label>Search (tokens: dept:/sku:/name:)</mat-label>
                <input matInput [value]="storeFilters.controls.q.value" (input)="onStoreQ($event)" placeholder='e.g., dept:Inventory name:"10x12 Shed"'>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Dept</mat-label>
                <mat-select class="action" [value]="storeFilters.controls.dept.value" (selectionChange)="storeOnDept($event.value)">
                  <mat-option [value]="''">All</mat-option>
                  <mat-option *ngFor="let d of depts" [value]="d">{{ d }}</mat-option>
                </mat-select>
              </mat-form-field>

              <span class="spacer"></span>

              <button mat-stroked-button color="primary" (click)="storeReset()">
                <mat-icon>clear</mat-icon> Clear
              </button>
            </div>
          </section>

          <section class="card">
            <table mat-table [dataSource]="storeDS" matSort #storeSort="matSort" class="rep-table">
              <ng-container matColumnDef="sku">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>SKU</th>
                <td mat-cell *matCellDef="let r">{{ r.sku }}</td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
                <td mat-cell *matCellDef="let r">{{ r.name }}</td>
              </ng-container>

              <ng-container matColumnDef="dept">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Dept</th>
                <td mat-cell *matCellDef="let r">{{ r.dept }}</td>
              </ng-container>

              <ng-container matColumnDef="margin">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Margin %</th>
                <td mat-cell *matCellDef="let r">{{ r.margin }}</td>
              </ng-container>

              <ng-container matColumnDef="revenue">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Revenue</th>
                <td mat-cell *matCellDef="let r">\${{ r.revenue | number:'1.0-0' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="storeCols" class="table-header"></tr>
              <tr mat-row *matRowDef="let row; columns: storeCols;"></tr>
            </table>
            <mat-paginator [pageSize]="10" [pageSizeOptions]="[10,25,50]" #storePaginator></mat-paginator>
          </section>
        </mat-tab>
      </mat-tab-group>
    </ng-container>
  </div>
  `,
  styles: [`
    :host{ --primary:#2563eb; --slate:#0f172a; --muted:#64748b; --card:#fff; --border:#e2e8f0; --bg:#f6f7fb }
    .page-wrap{ padding:16px; background:var(--bg); color:var(--slate) }
    .page-hd{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px }
    .page-hd h1{ font-size:22px; font-weight:700; color:var(--slate); margin:0 }
    .views button span{ margin-left:6px }
    :host ::ng-deep .mat-mdc-tab .mdc-tab__text-label {
      color: #2563eb !important; /* primary color */
      font-weight: 600;
    }
    .action.mat-mdc-select{
    color: #2563eb !important;
    }
    :host ::ng-deep .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
      color: #2563eb !important; /* keep active tab consistent */
      font-weight: 700;
    }

    :host ::ng-deep .mat-mdc-tab .mdc-tab-indicator__content--underline {
      border-color: #2563eb !important; /* underline indicator color */
    }
    /* Force readable text in mat-select trigger */
    :host .mat-mdc-select-trigger,
    :host .mat-mdc-select-value,
    :host .mat-mdc-select-value-text,
    :host .mat-mdc-select-arrow {
      color: #0f172a !important; /* slate-900 */
    }

    /* Keep it dark even when focused/filled/disabled */
    :host .mat-mdc-select.mat-mdc-select-focused .mat-mdc-select-trigger,
    :host .mat-mdc-select.mat-mdc-select-disabled .mat-mdc-select-trigger {
      color: #0f172a !important;
    }

    /* Field label + input text stay dark */
    :host .mat-mdc-form-field .mdc-floating-label,
    :host .mat-mdc-input-element {
      color: #0f172a !important;
    }

    /* Select panel (dropdown) colors */
    :host ::ng-deep .cdk-overlay-container .mat-mdc-select-panel {
      background: #fff !important;
      color: #0f172a !important;
      border: 1px solid #e2e8f0;
    }
    :host ::ng-deep .cdk-overlay-container .mat-mdc-option {
      color: #0f172a !important;
    }
    :host ::ng-deep .cdk-overlay-container .mat-mdc-option.mdc-list-item--selected {
      background: rgba(37, 99, 235, .12) !important;   /* primary tint */
    }
    :host ::ng-deep .cdk-overlay-container .mat-mdc-option.mdc-list-item--activated,
    :host ::ng-deep .cdk-overlay-container .mat-mdc-option:hover {
      background: rgba(37, 99, 235, .08) !important;
    }

    /* Outline goes primary on focus to match your spec */
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing,
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch {
      border-color: #2563eb !important;
    }
    .selec

    .kpis{ display:grid; gap:12px; grid-template-columns: repeat(4, minmax(0,1fr)); margin-bottom:12px }
    .kpi{ background:var(--card); border:1px solid var(--border); border-radius:14px; padding:16px }
    .kpi .kpi-num{ font-size:24px; font-weight:800; color:var(--slate) }
    .kpi .kpi-label{ color:var(--muted); font-weight:600 }
    .kpi.warn .kpi-num{ color:#b91c1c }

    .card{ background:var(--card); border:1px solid var(--border); border-radius:12px; padding:12px; margin-bottom:12px }
    .filters{ display:flex; flex-wrap:wrap; gap:12px; align-items:center }
    .filters .q-field{ flex:1 1 480px; min-width:260px }
    .filters .spacer{ flex:1 1 auto }

    table.rep-table{ width:100%; background:#fff; border-radius:12px; overflow:hidden; border:1px solid var(--border) }
    .table-header th{ background: var(--primary); color:#fff; font-weight:700 }
    td{ color:var(--slate) }
    .chip{ padding:2px 8px; border-radius:999px; font-size:12px; font-weight:700; border:1px solid var(--border); display:inline-block }
    .chip.ok{ background:#ecfdf5; color:#065f46; border-color:#a7f3d0 }
    .chip.warn{ background:#fff7ed; color:#9a3412; border-color:#fed7aa }
    .chip.danger{ background:#fef2f2; color:#991b1b; border-color:#fecaca }

    .blocked{ display:flex; gap:12px; align-items:flex-start; }
    .blocked mat-icon{ color:#b91c1c }
  `]
})
export class LocationReportsPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  storeName = 'Hartville';
  depts = ['Inventory','Service','Delivery','Rentals','Support','Sales'];

  // Role helpers
  private locId = signal<string>(this.route.snapshot.paramMap.get('id') || 's1');
  private userRoles = computed(() => {
    const u = this.auth.getUser();
    const rs = u ? rolesForLocation(u, this.locId()) : [];
    return new Set(rs.map(r => String(r).toUpperCase()));
  });
  canView = () => {
    const r = this.userRoles();
    return r.has('OWNER') || r.has('ADMIN') || r.has('MANAGER');
  };
  canSeeStoreTab = () => {
    const r = this.userRoles();
    return r.has('OWNER') || r.has('ADMIN');
  };

  // ===== Management report =====
  mgmtCols = ['owner','dept','kpi','value','trend'];
  mgmtDS = new MatTableDataSource<MgmtReportRow>([
    { id:'M1', owner:'Sam',   dept:'Service',   kpi:'Tickets Closed', value:42, trend:'up',   updatedAt:new Date().toISOString() },
    { id:'M2', owner:'Alex',  dept:'Delivery',  kpi:'On-Time %',      value:91, trend:'flat', updatedAt:new Date().toISOString() },
    { id:'M3', owner:'Casey', dept:'Inventory', kpi:'OOS Items',      value:7,  trend:'down', updatedAt:new Date().toISOString() },
  ]);
  mgmtFilters = this.fb.group({ q:[''], dept:[''] });
  tabIndex = 0;

  mgmtTotal = () => this.currentMgmt().reduce((n,r)=>n+(r.value||0),0);
  mgmtUps   = () => this.currentMgmt().filter(r=>r.trend==='up').length;
  mgmtDowns = () => this.currentMgmt().filter(r=>r.trend==='down').length;
  mgmtFlats = () => this.currentMgmt().filter(r=>r.trend==='flat').length;

  // ===== Store report (Admin/Owner) =====
  storeCols = ['sku','name','dept','margin','revenue'];
  storeDS = new MatTableDataSource<StoreReportRow>([
    { id:'S1', sku:'SHD-10x12', name:'10x12 Shed',     dept:'Inventory', margin:28, revenue: 42000, updatedAt:new Date().toISOString() },
    { id:'S2', sku:'EZGO-STD',  name:'EZGO Cart',      dept:'Rentals',   margin:35, revenue: 12200, updatedAt:new Date().toISOString() },
    { id:'S3', sku:'SV-103',    name:'Service Labor',  dept:'Service',   margin:52, revenue:  8800, updatedAt:new Date().toISOString() },
  ]);
  storeFilters = this.fb.group({ q:[''], dept:[''] });

  // ===== Custom Views (per-location/user/tab) =====
  private viewKey(tab: 'mgmt'|'store'){
    const uId = (this.auth.getUser() as any)?.id || 'anon';
    return `hog:reports:${this.locId()}:${uId}:${tab}`;
  }
  savedViewNames = signal<string[]>([]);
  private refreshViewNames(){
    const names = new Set<string>();
    Object.keys(localStorage).forEach(k=>{
      if (k.startsWith(`hog:reports:${this.locId()}`)) {
        try { const v = JSON.parse(localStorage.getItem(k) || '{}'); if (v?.name) names.add(v.name); } catch {}
      }
    });
    this.savedViewNames.set(Array.from(names).sort());
  }
  saveCurrentView(){
    const name = prompt('Name this view:');
    if (!name) return;
    const tab = this.tabIndex===0 ? 'mgmt' : 'store';
    const key = `${this.viewKey(tab)}:${name}`;
    const payload = tab==='mgmt'
      ? { name, tab, filters: this.mgmtFilters.value }
      : { name, tab, filters: this.storeFilters.value };
    localStorage.setItem(key, JSON.stringify(payload));
    this.refreshViewNames();
  }
  applyView(name: string){
    const mgKey = `${this.viewKey('mgmt')}:${name}`;
    const stKey = `${this.viewKey('store')}:${name}`;
    const raw = localStorage.getItem(mgKey) || localStorage.getItem(stKey);
    if (!raw) return;
    try {
      const v = JSON.parse(raw);
      if (v.tab==='mgmt') { this.tabIndex = 0; this.mgmtFilters.patchValue(v.filters||{}, {emitEvent:false}); this.applyMgmt(); }
      else { this.tabIndex = this.canSeeStoreTab() ? 1 : 0; this.storeFilters.patchValue(v.filters||{}, {emitEvent:false}); this.applyStore(); }
    } catch {}
  }
  deleteView(){
    const name = prompt('Delete which view? Enter exact name:');
    if (!name) return;
    [ 'mgmt','store' ].forEach(t => {
      const k = `${this.viewKey(t as 'mgmt'|'store')}:${name}`;
      localStorage.removeItem(k);
    });
    this.refreshViewNames();
  }

  // ===== Template refs for independent paginators/sorts =====
  @ViewChild('mgmtPaginator') mgmtPaginator!: MatPaginator;
  @ViewChild('mgmtSort') mgmtSort!: MatSort;
  @ViewChild('storePaginator') storePaginator!: MatPaginator;
  @ViewChild('storeSort') storeSort!: MatSort;

  ngAfterViewInit(){
    // Management predicate
    this.mgmtDS.filterPredicate = (row, raw) => {
      const f = JSON.parse(raw || '{}') as { q?: string; dept?: string };
      const q = (f.q||'').toLowerCase().trim();
      const deptOk = f.dept ? row.dept===f.dept : true;

      // tokens: dept:, owner:, kpi:
      let free = q, tDept='', tOwner='', tKpi='';
      q.split(/\s+/).forEach(part=>{
        const m = part.match(/^(dept|owner|kpi):(.*)$/i);
        if (m) {
          const key=m[1].toLowerCase(), val=m[2].toLowerCase().replace(/^"|"$/g,'');
          if (key==='dept') tDept=val; if (key==='owner') tOwner=val; if (key==='kpi') tKpi=val;
          free = free.replace(part,'').trim();
        }
      });

      const freeOk = !free || row.kpi.toLowerCase().includes(free) || row.owner.toLowerCase().includes(free) || row.dept.toLowerCase().includes(free);
      const tDeptOk = !tDept || row.dept.toLowerCase().includes(tDept);
      const tOwnerOk= !tOwner|| row.owner.toLowerCase().includes(tOwner);
      const tKpiOk  = !tKpi || row.kpi.toLowerCase().includes(tKpi);

      return deptOk && freeOk && tDeptOk && tOwnerOk && tKpiOk;
    };

    // Store predicate
    this.storeDS.filterPredicate = (row, raw) => {
      const f = JSON.parse(raw || '{}') as { q?: string; dept?: string };
      const q = (f.q||'').toLowerCase().trim();
      const deptOk = f.dept ? row.dept===f.dept : true;

      // tokens: dept:, sku:, name:
      let free = q, tDept='', tSku='', tName='';
      q.split(/\s+/).forEach(part=>{
        const m = part.match(/^(dept|sku|name):(.*)$/i);
        if (m) {
          const key=m[1].toLowerCase(), val=m[2].toLowerCase().replace(/^"|"$/g,'');
          if (key==='dept') tDept=val; if (key==='sku') tSku=val; if (key==='name') tName=val;
          free = free.replace(part,'').trim();
        }
      });

      const freeOk = !free || row.name.toLowerCase().includes(free) || row.sku.toLowerCase().includes(free) || row.dept.toLowerCase().includes(free);
      const tDeptOk = !tDept || row.dept.toLowerCase().includes(tDept);
      const tSkuOk  = !tSku  || row.sku.toLowerCase().includes(tSku);
      const tNameOk = !tName || row.name.toLowerCase().includes(tName);

      return deptOk && freeOk && tDeptOk && tSkuOk && tNameOk;
    };

    // Attach paginators/sorts
    this.mgmtDS.paginator = this.mgmtPaginator;
    this.mgmtDS.sort = this.mgmtSort;
    this.storeDS.paginator = this.storePaginator;
    this.storeDS.sort = this.storeSort;

    // Initial apply + populate view list
    this.applyMgmt();
    this.applyStore();
    this.refreshViewNames();
  }

  // Management filters
  onMgmtQ(e: Event){ this.mgmtFilters.patchValue({ q: (e.target as HTMLInputElement).value || '' }, {emitEvent:false}); this.applyMgmt(); }
  mgmtOnDept(v: string){ this.mgmtFilters.patchValue({ dept: v }, {emitEvent:false}); this.applyMgmt(); }
  mgmtReset(){ this.mgmtFilters.reset({ q:'', dept:'' }, {emitEvent:false}); this.applyMgmt(); }
  private applyMgmt(){
    const f = this.mgmtFilters.value;
    this.mgmtDS.filter = JSON.stringify({ q: f.q || '', dept: f.dept || '' });
    if (this.mgmtDS.paginator) this.mgmtDS.paginator.firstPage();
  }
  private currentMgmt(){ return this.mgmtDS.filteredData.length ? this.mgmtDS.filteredData : this.mgmtDS.data; }

  // Store filters
  onStoreQ(e: Event){ this.storeFilters.patchValue({ q: (e.target as HTMLInputElement).value || '' }, {emitEvent:false}); this.applyStore(); }
  storeOnDept(v: string){ this.storeFilters.patchValue({ dept: v }, {emitEvent:false}); this.applyStore(); }
  storeReset(){ this.storeFilters.reset({ q:'', dept:'' }, {emitEvent:false}); this.applyStore(); }
  private applyStore(){
    const f = this.storeFilters.value;
    this.storeDS.filter = JSON.stringify({ q: f.q || '', dept: f.dept || '' });
    if (this.storeDS.paginator) this.storeDS.paginator.firstPage();
  }

  // ===== Store KPI helpers (missing methods implemented) =====
  private currentStore(){ return this.storeDS.filteredData.length ? this.storeDS.filteredData : this.storeDS.data; }
  storeRevenue(){ return this.currentStore().reduce((n,r)=> n + (r.revenue||0), 0); }
  storeItems(){ return this.currentStore().length; }
  storeAvgMargin(){
    const rows = this.currentStore(); if (!rows.length) return 0;
    const sum = rows.reduce((n,r)=> n + (r.margin||0), 0);
    return Math.round((sum / rows.length) * 10) / 10; // 1 decimal
    }
  storeLowMargin(){
    return this.currentStore().filter(r => (r.margin ?? 0) < 20).length;
  }
}
