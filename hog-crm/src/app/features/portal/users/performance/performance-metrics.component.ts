import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type {
  Performance,
  ManagerPerformance,
  SalesPerformance,
  CustomerServicePerformance,
  ServicePerformance,
  DeliveryPerformance,
  RentalsPerformance,
} from '../../../../types/performance.types';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'hog-performance-metrics',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="card">
      <div class="row header">
        <div class="period"><mat-icon>timeline</mat-icon> {{ record?.period || '—' }}</div>
        <div class="score" *ngIf="record?.overallScore != null">Score: {{ record?.overallScore }}</div>
      </div>

      <!-- Manager -->
      <div class="grid" *ngIf="isManager(record)">
        <div><label>Store Sales</label><b>{{ mgr()?.storeSales | currency }}</b></div>
        <div><label>Staff Morale</label><b>{{ mgr()?.staffMorale }}/5</b></div>
        <div><label>Inventory Accuracy</label><b>{{ mgr()?.inventoryAccuracy }}%</b></div>
        <div><label>Operational Upkeep</label><b>{{ mgr()?.operationalUpkeep }}%</b></div>
        <div><label>Community</label><b>{{ mgr()?.communityEngagement }}/5</b></div>
        <div><label>Goal Execution</label><b>{{ mgr()?.goalExecution }}/5</b></div>
      </div>

      <!-- Sales -->
      <div class="grid" *ngIf="isSales(record)">
        <div><label>Total Sales</label><b>{{ sales()?.totalSales | currency }}</b></div>
        <div><label>Close Ratio</label><b>{{ sales()?.closeRatio }}%</b></div>
        <div><label>Sales Cycle</label><b>{{ sales()?.salesCycleDays }} days</b></div>
        <div><label>Avg Follow Ups</label><b>{{ sales()?.followUpAvg }}</b></div>
        <div><label>Repeat Rate</label><b>{{ sales()?.repeatRate }}%</b></div>
        <div><label>On-Time</label><b>{{ record?.onTimeRate ?? '—' }}<ng-container *ngIf="record?.onTimeRate != null">%</ng-container></b></div>
      </div>

      <!-- Customer Service -->
      <div class="grid" *ngIf="isCS(record)">
        <div><label>First Response</label><b>{{ cs()?.firstResponseMins }}m</b></div>
        <div><label>Resolution</label><b>{{ cs()?.resolutionMins }}m</b></div>
        <div><label>CSAT</label><b>{{ cs()?.csat }}%</b></div>
        <div><label>Handled</label><b>{{ cs()?.contactsHandled }}</b></div>
        <div><label>Escalations</label><b>{{ cs()?.escalationRate }}%</b></div>
        <div><label>On-Time</label><b>{{ record?.onTimeRate ?? '—' }}<ng-container *ngIf="record?.onTimeRate != null">%</ng-container></b></div>
      </div>

      <!-- Service -->
      <div class="grid" *ngIf="isService(record)">
        <div><label>Units Serviced</label><b>{{ svc()?.unitsServiced }}</b></div>
        <div><label>Avg Time / Unit</label><b>{{ svc()?.avgServiceMins }}m</b></div>
        <div><label>First-Time Fix</label><b>{{ svc()?.firstTimeFixRate }}%</b></div>
        <div><label>Repeat Issues</label><b>{{ svc()?.repeatIssueRate }}%</b></div>
        <div><label>CSAT</label><b>{{ svc()?.csat }}%</b></div>
        <div><label>Safety Incidents</label><b>{{ svc()?.safetyIncidents }}</b></div>
      </div>

      <!-- Delivery -->
      <div class="grid" *ngIf="isDelivery(record)">
        <div><label>On-Time</label><b>{{ record?.onTimeRate ?? '—' }}<ng-container *ngIf="record?.onTimeRate != null">%</ng-container></b></div>
        <div><label>Avg Delivery</label><b>{{ deliv()?.avgDeliveryMins }}m</b></div>
        <div><label>Efficiency</label><b>{{ deliv()?.efficiency }}/hr</b></div>
        <div><label>CSAT</label><b>{{ deliv()?.csat }}%</b></div>
        <div><label>Damage Rate</label><b>{{ deliv()?.damageRate }}%</b></div>
        <div><label>Safety Incidents</label><b>{{ deliv()?.safetyIncidents }}</b></div>
      </div>

      <!-- Rentals -->
      <div class="grid" *ngIf="isRentals(record)">
        <div><label>Rental Volume</label><b>{{ rent()?.rentalVolume }}</b></div>
        <div><label>Rental Revenue</label><b>{{ rent()?.rentalRevenue | currency }}</b></div>
        <div><label>Conversion</label><b>{{ rent()?.conversionRate }}%</b></div>
        <div><label>Utilization</label><b>{{ rent()?.utilizationRate }}%</b></div>
        <div><label>Repeat Rentals</label><b>{{ rent()?.repeatRentalRate }}%</b></div>
      </div>
    </div>
  `,
  styles: [`
    .card { padding:12px; border:1px solid rgba(0,0,0,.08); border-radius:12px; background:#fff; }
    .row.header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:6px; }
    .period { display:flex; align-items:center; gap:6px; font-weight:600; color:#1a1a1a; }
    .grid { display:grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap:10px 16px; margin-top:10px; }
    label { display:block; font-size:12px; opacity:.7; text-transform:uppercase; letter-spacing:.04em; color:#000; }
    b { font-weight:700; color:#1a1a1a; }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class PerformanceMetricsComponent {
  @Input() record?: Performance | null;

  // ---- Type guards ----
  isManager = (r?: Performance | null): r is ManagerPerformance => !!r && 'storeSales' in r;
  isSales = (r?: Performance | null): r is SalesPerformance => !!r && 'totalSales' in r;
  isCS = (r?: Performance | null): r is CustomerServicePerformance => !!r && 'firstResponseMins' in r;
  isService = (r?: Performance | null): r is ServicePerformance => !!r && 'unitsServiced' in r;
  isDelivery = (r?: Performance | null): r is DeliveryPerformance => !!r && 'avgDeliveryMins' in r;
  isRentals = (r?: Performance | null): r is RentalsPerformance => !!r && 'rentalVolume' in r;

  // ---- Narrowed getters used in template (avoid `as` in HTML) ----
  mgr(): ManagerPerformance | null { return this.isManager(this.record) ? this.record : null; }
  sales(): SalesPerformance | null { return this.isSales(this.record) ? this.record : null; }
  cs(): CustomerServicePerformance | null { return this.isCS(this.record) ? this.record : null; }
  svc(): ServicePerformance | null { return this.isService(this.record) ? this.record : null; }
  deliv(): DeliveryPerformance | null { return this.isDelivery(this.record) ? this.record : null; }
  rent(): RentalsPerformance | null { return this.isRentals(this.record) ? this.record : null; }
}
