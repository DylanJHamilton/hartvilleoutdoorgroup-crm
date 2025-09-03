import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { mockStores } from '../../../../mock/locations.mock';
import { AuthService } from '../../../../core/auth/auth.service';
import { PerformanceService } from '../performance/performance.service';
import type { Role } from '../../../../types/role.types';
import type {
  Performance,
  ManagerPerformance,
  SalesPerformance,
  CustomerServicePerformance,
  ServicePerformance,
  DeliveryPerformance,
  RentalsPerformance,
} from '../../../../types/performance.types';

type UserViewData = {
  user: {
    id: string;
    name: string;
    email: string;
    roles: Role[];
    locationIds?: string[];
    assignments?: { locationId: string; roles: Role[] }[];
  };
};

@Component({
  standalone: true,
  selector: 'hog-user-view-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatChipsModule, MatIconModule, MatDividerModule],
  template: `
  <h2 mat-dialog-title>Employee — {{ u.name }}</h2>

  <div mat-dialog-content class="wrap">
    <div class="profile">
      <div class="avatar"><mat-icon>person</mat-icon></div>
      <div>
        <div class="name">{{ u.name }}</div>
        <div class="email">{{ u.email }}</div>
        <div class="chips">
          <mat-chip-set>
            <mat-chip *ngFor="let r of roles" class="role-chip">{{ r }}</mat-chip>
          </mat-chip-set>
        </div>
        <div class="chips">
          <mat-chip-set>
            <mat-chip *ngFor="let l of locationNames" class="loc-chip">{{ l }}</mat-chip>
          </mat-chip-set>
        </div>
      </div>
    </div>

    <mat-divider></mat-divider>

    <div class="perf">
      <div class="section-head">Latest Performance ({{ latestPeriod || '—' }})</div>

      <div class="kpi-grid" *ngIf="latestRecord; else none">
        <!-- Manager KPIs (read-only) -->
        <div *ngIf="latestRecord.onTimeRate != null"><label>On-Time</label><b>{{ latestRecord.onTimeRate }}%</b></div>
        <div *ngIf="latestRecord.attitudeScore != null"><label>Attitude</label><b>{{ latestRecord.attitudeScore }}/5</b></div>
        <div class="full" *ngIf="latestRecord.coachingNotes"><label>Coaching Notes</label><div class="notes">{{ latestRecord.coachingNotes }}</div></div>

        <!-- Role sections (read-only) -->
        <ng-container *ngIf="isManager(latestRecord)">
          <div><label>Store Sales</label><b>{{ mgr()?.storeSales | currency }}</b></div>
          <div><label>Staff Morale</label><b>{{ mgr()?.staffMorale }}/5</b></div>
          <div><label>Inventory Accuracy</label><b>{{ mgr()?.inventoryAccuracy }}%</b></div>
          <div><label>Operational Upkeep</label><b>{{ mgr()?.operationalUpkeep }}%</b></div>
          <div><label>Community</label><b>{{ mgr()?.communityEngagement }}/5</b></div>
          <div><label>Goal Execution</label><b>{{ mgr()?.goalExecution }}/5</b></div>
        </ng-container>

        <ng-container *ngIf="isSales(latestRecord)">
          <div><label>Total Sales</label><b>{{ sales()?.totalSales | currency }}</b></div>
          <div><label>Close Ratio</label><b>{{ sales()?.closeRatio }}%</b></div>
          <div><label>Sales Cycle</label><b>{{ sales()?.salesCycleDays }} days</b></div>
          <div><label>Avg Follow Ups</label><b>{{ sales()?.followUpAvg }}</b></div>
          <div><label>Repeat Rate</label><b>{{ sales()?.repeatRate }}%</b></div>
        </ng-container>

        <ng-container *ngIf="isCS(latestRecord)">
          <div><label>First Response</label><b>{{ cs()?.firstResponseMins }}m</b></div>
          <div><label>Resolution</label><b>{{ cs()?.resolutionMins }}m</b></div>
          <div><label>CSAT</label><b>{{ cs()?.csat }}%</b></div>
          <div><label>Handled</label><b>{{ cs()?.contactsHandled }}</b></div>
          <div><label>Escalations</label><b>{{ cs()?.escalationRate }}%</b></div>
        </ng-container>

        <ng-container *ngIf="isService(latestRecord)">
          <div><label>Units Serviced</label><b>{{ svc()?.unitsServiced }}</b></div>
          <div><label>Avg Time / Unit</label><b>{{ svc()?.avgServiceMins }}m</b></div>
          <div><label>First-Time Fix</label><b>{{ svc()?.firstTimeFixRate }}%</b></div>
          <div><label>Repeat Issues</label><b>{{ svc()?.repeatIssueRate }}%</b></div>
          <div><label>CSAT</label><b>{{ svc()?.csat }}%</b></div>
          <div><label>Safety Incidents</label><b>{{ svc()?.safetyIncidents }}</b></div>
        </ng-container>

        <ng-container *ngIf="isDelivery(latestRecord)">
          <div><label>On-Time (Delivery)</label><b>{{ latestRecord.onTimeRate ?? '—' }}<ng-container *ngIf="latestRecord.onTimeRate != null">%</ng-container></b></div>
          <div><label>Avg Delivery</label><b>{{ deliv()?.avgDeliveryMins }}m</b></div>
          <div><label>Efficiency</label><b>{{ deliv()?.efficiency }}/hr</b></div>
          <div><label>CSAT</label><b>{{ deliv()?.csat }}%</b></div>
          <div><label>Damage Rate</label><b>{{ deliv()?.damageRate }}%</b></div>
          <div><label>Safety Incidents</label><b>{{ deliv()?.safetyIncidents }}</b></div>
        </ng-container>

        <ng-container *ngIf="isRentals(latestRecord)">
          <div><label>Rental Volume</label><b>{{ rent()?.rentalVolume }}</b></div>
          <div><label>Rental Revenue</label><b>{{ rent()?.rentalRevenue | currency }}</b></div>
          <div><label>Conversion</label><b>{{ rent()?.conversionRate }}%</b></div>
          <div><label>Utilization</label><b>{{ rent()?.utilizationRate }}%</b></div>
          <div><label>Repeat Rentals</label><b>{{ rent()?.repeatRentalRate }}%</b></div>
        </ng-container>
      </div>

      <ng-template #none><div class="muted">No KPI records yet.</div></ng-template>
    </div>
  </div>

  <div mat-dialog-actions align="end">
    <button mat-flat-button color="primary" (click)="close()">Close</button>
  </div>
  `,
  styles: [`
    .wrap { min-width: 680px; max-width: 900px; display:flex; flex-direction:column; gap:12px; }
    .profile { display:flex; gap:12px; align-items:center; }
    .avatar { width:56px; height:56px; border-radius:50%; background:#e9eef6; color:#3b4a66; display:grid; place-items:center; }
    .name { font-weight:700; font-size:18px; color:#1a1a1a; }
    .email { opacity:.8; }
    .chips { margin-top:6px; }
    .role-chip{ background:#eef3ff; color:#1a1a1a; border:1px solid rgba(0,0,0,.08); }
    .loc-chip{ background:#eef8f1; color:#1a1a1a; border:1px solid rgba(0,0,0,.08); }

    .section-head { font-weight:700; margin:8px 0; }
    .kpi-grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px 16px; }
    .kpi-grid .full { grid-column: 1 / -1; }
    .notes { white-space: pre-wrap; background:#fafafa; border:1px solid rgba(0,0,0,.06); border-radius:8px; padding:8px; color: #000; }
    .muted { opacity:.7; }
    @media (max-width: 720px) { .wrap { min-width: 0; } .kpi-grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class UserViewDialog {
  private ref = inject(MatDialogRef<UserViewDialog>);
  private data = inject<UserViewData>(MAT_DIALOG_DATA);
  private perf = inject(PerformanceService);
  private auth = inject(AuthService);

  u = this.data.user;
  roles = (this.u.roles ?? []) as string[];
  locationNames = (() => {
    const ids = (this.u.assignments?.map(a => a.locationId) ?? this.u.locationIds ?? []);
    const map = new Map(mockStores.map(s => [s.id, s.name]));
    return ids.map(id => map.get(id as any) ?? id);
  })();

  latestRecord = this.perf.latestForUser(this.u.id);
  latestPeriod = this.latestRecord?.period ?? null;

  // type guards + narrowed getters
  isManager(r?: Performance | null): r is ManagerPerformance { return !!r && 'storeSales' in r; }
  isSales(r?: Performance | null): r is SalesPerformance { return !!r && 'totalSales' in r; }
  isCS(r?: Performance | null): r is CustomerServicePerformance { return !!r && 'firstResponseMins' in r; }
  isService(r?: Performance | null): r is ServicePerformance { return !!r && 'unitsServiced' in r; }
  isDelivery(r?: Performance | null): r is DeliveryPerformance { return !!r && 'avgDeliveryMins' in r; }
  isRentals(r?: Performance | null): r is RentalsPerformance { return !!r && 'rentalVolume' in r; }

  mgr(): ManagerPerformance | null { return this.isManager(this.latestRecord) ? this.latestRecord : null; }
  sales(): SalesPerformance | null { return this.isSales(this.latestRecord) ? this.latestRecord : null; }
  cs(): CustomerServicePerformance | null { return this.isCS(this.latestRecord) ? this.latestRecord : null; }
  svc(): ServicePerformance | null { return this.isService(this.latestRecord) ? this.latestRecord : null; }
  deliv(): DeliveryPerformance | null { return this.isDelivery(this.latestRecord) ? this.latestRecord : null; }
  rent(): RentalsPerformance | null { return this.isRentals(this.latestRecord) ? this.latestRecord : null; }

  close() { this.ref.close(); }
}
