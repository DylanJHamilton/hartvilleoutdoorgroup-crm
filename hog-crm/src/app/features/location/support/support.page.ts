// src/app/features/location/support/support.page.ts
import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';

import { SupportRoleService } from './services/support-role.service';

// Replace with your real LocationContext service
class LocationContextStub { locationId = () => 's3'; storeName = () => 'Mentor'; }

type Case = {
  id:string;
  customer:string;
  channel:'Phone'|'Email'|'Web'|'In-Store';
  topic:string;
  status:'Open'|'Pending'|'Resolved';
  owner:string;
};

@Component({
  standalone: true,
  selector: 'hog-store-support',
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatCardModule, MatIconModule, MatChipsModule
  ],
  template: `
  <div class="px-4 py-4 space-y-6">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-slate-800">Support — {{ storeName() }}</h1>
      <div class="flex items-center gap-2">
        <button mat-raised-button color="primary" [routerLink]="['./tickets']">Open Tickets</button>
      </div>
    </header>

    <!-- KPIs: one row -->
    <section class="grid gap-4 md:grid-cols-4">
      <mat-card class="kpi"><div class="kpi-num">{{ openCount() }}</div><div class="kpi-label">Open</div></mat-card>
      <mat-card class="kpi"><div class="kpi-num">{{ pendingCount() }}</div><div class="kpi-label">Pending</div></mat-card>
      <mat-card class="kpi"><div class="kpi-num">{{ resolvedTodayCount() }}</div><div class="kpi-label">Resolved Today</div></mat-card>
      <mat-card class="kpi warn"><div class="kpi-num">{{ attentionCount() }}</div><div class="kpi-label">Needs Attention</div></mat-card>
    </section>

    <!-- CSR-only: My Performance -->
    <section *ngIf="canSeeCSR()" class="grid gap-4 md:grid-cols-3">
      <mat-card>
        <div class="card-header"><h2>My Performance</h2></div>
        <div class="stat-row"><span>My Open</span><strong>{{ myOpenCount() }}</strong></div>
        <div class="stat-row"><span>My Pending</span><strong>{{ myPendingCount() }}</strong></div>
        <div class="stat-row"><span>My Resolved (7d)</span><strong>{{ myResolved7dCount() }}</strong></div>
        <div class="muted mt-2">Visible to Support/CSR only.</div>
      </mat-card>
    </section>

    <!-- Managers/Admin/Owners: Team Performance -->
    <section *ngIf="canSeeMgr()" class="grid gap-4 md:grid-cols-3">
      <mat-card>
        <div class="card-header"><h2>Team Performance</h2></div>
        <div class="stat-row"><span>Team Open</span><strong>{{ teamOpenCount() }}</strong></div>
        <div class="stat-row"><span>Team Pending</span><strong>{{ teamPendingCount() }}</strong></div>
        <div class="stat-row"><span>Resolved (7d)</span><strong>{{ teamResolved7dCount() }}</strong></div>
      </mat-card>
    </section>

    <!-- Single Filter Field: tokens like "channel:Phone status:Open <free text>" -->
    <section class="filters">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Search tickets (e.g., "channel:Phone status:Open delivery")</mat-label>
        <input matInput
               [value]="query"
               (input)="onQuery($event.target.value)"
               placeholder='channel:Phone status:Open term'>
      </mat-form-field>
      <button mat-stroked-button color="primary" (click)="clearFilters()">Clear</button>
    </section>

    <!-- Table -->
    <section class="overflow-auto">
      <table mat-table [dataSource]="dataSource" matSort class="w-full table-elevated">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
          <td mat-cell *matCellDef="let r">{{ r.id }}</td>
        </ng-container>
        <ng-container matColumnDef="customer">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Customer</th>
          <td mat-cell *matCellDef="let r">{{ r.customer }}</td>
        </ng-container>
        <ng-container matColumnDef="topic">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Topic</th>
          <td mat-cell *matCellDef="let r">{{ r.topic }}</td>
        </ng-container>
        <ng-container matColumnDef="channel">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Channel</th>
          <td mat-cell *matCellDef="let r">{{ r.channel }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
          <td mat-cell *matCellDef="let r">
            <span class="chip" [class.chip-open]="r.status==='Open'"
                               [class.chip-pending]="r.status==='Pending'"
                               [class.chip-resolved]="r.status==='Resolved'">{{ r.status }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="owner">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Owner</th>
          <td mat-cell *matCellDef="let r">{{ r.owner || 'Unassigned' }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="cols" class="table-header"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
      <mat-paginator [pageSize]="10" [pageSizeOptions]="[10,25,50]"></mat-paginator>
    </section>
  </div>
  `,
  styleUrl: './support.page.scss'
})
export class SupportPage {
  private fb = inject(FormBuilder);
  private roles = inject(SupportRoleService);
  private loc = new LocationContextStub();

  storeName = () => this.loc.storeName();
  locationId = () => this.loc.locationId();

  // ===== demo data
  cols = ['id','customer','topic','channel','status','owner'];
  dataSource = new MatTableDataSource<Case>([
    { id:'C-1001', customer:'Sara J',  topic:'Delivery update',       channel:'Phone',    status:'Open',     owner:'CS-1' },
    { id:'C-1002', customer:'Mike R',  topic:'Invoice copy',          channel:'Email',    status:'Pending',  owner:'CS-2' },
    { id:'C-1003', customer:'A. Patel',topic:'Damaged part report',   channel:'Web',      status:'Open',     owner:'CS-1' },
    { id:'C-1004', customer:'Liu W',   topic:'Change delivery date',  channel:'In-Store', status:'Resolved', owner:'CS-3' },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(){
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.applyFilters();
  }

  // ===== role gates
  canSeeCSR = () => this.roles.isCSR(this.locationId());
  canSeeMgr = () => this.roles.isManagerPlus(this.locationId());

  // ===== KPIs
  private data = () => this.dataSource.data;
  private me = () => this.roles.currentOwnerId();
  openCount()           { return this.data().filter(x => x.status === 'Open').length; }
  pendingCount()        { return this.data().filter(x => x.status === 'Pending').length; }
  resolvedTodayCount()  { return this.data().filter(x => x.status === 'Resolved').length; } // placeholder
  attentionCount()      { return this.data().filter(x => x.status !== 'Resolved').length; }

  myOpenCount()         { return this.data().filter(x => x.owner === this.me() && x.status === 'Open').length; }
  myPendingCount()      { return this.data().filter(x => x.owner === this.me() && x.status === 'Pending').length; }
  myResolved7dCount()   { return this.data().filter(x => x.owner === this.me() && x.status === 'Resolved').length; } // placeholder

  teamOpenCount()       { return this.data().filter(x => x.status === 'Open').length; }
  teamPendingCount()    { return this.data().filter(x => x.status === 'Pending').length; }
  teamResolved7dCount() { return this.data().filter(x => x.status === 'Resolved').length; }

  // ===== Single-field filters
  query = '';
  onQuery(v: string){ this.query = v || ''; this.applyFilters(); }

  clearFilters(){ this.query = ''; this.applyFilters(); }

  private parseQuery(q: string){
    // very light parser: tokens channel:<val> status:<val> owner:<val> + free text
    const parts = q.split(/\s+/).filter(Boolean);
    const out: any = { text: [] as string[], channel: '', status: '', owner: '' };
    for (const p of parts) {
      const m = p.match(/^(channel|status|owner):(.*)$/i);
      if (m) { out[m[1].toLowerCase()] = m[2]; }
      else out.text.push(p);
    }
    out.text = out.text.join(' ').toLowerCase();
    return out as { text:string; channel:string; status:string; owner:string };
  }

  applyFilters(){
    const { text, channel, status, owner } = this.parseQuery(this.query);
    this.dataSource.filterPredicate = (row: Case) => {
      const qMatch = !text || row.customer.toLowerCase().includes(text) || row.topic.toLowerCase().includes(text) || (row.owner||'').toLowerCase().includes(text);
      const chMatch = !channel || row.channel.toLowerCase() === channel.toLowerCase();
      const stMatch = !status  || row.status.toLowerCase()  === status.toLowerCase();
      const owMatch = !owner   || (row.owner||'').toLowerCase() === owner.toLowerCase();
      return qMatch && chMatch && stMatch && owMatch;
    };
    this.dataSource.filter = Math.random().toString();
  }
}
