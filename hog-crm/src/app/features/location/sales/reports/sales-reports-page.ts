import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { AccessService } from '../../../../shared/services/access.service';
import { ReportsService } from './reports.service';
import { ForecastService } from '../../../../shared/services/forecast.service';

import { ForecastManagerComponent } from './forecast-manager/forecast-manager';
import { ForecastRepComponent } from './forecast-rep/forecast-rep';
import { SelfReportsComponent } from './self-reports/self-reports';
import { TopSellersComponent } from './top-sellers/top-sellers';

type Timeframe = 'DTD' | 'WTD' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM';

@Component({
  standalone: true,
  selector: 'hog-sales-reports-page',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    ForecastManagerComponent,
    ForecastRepComponent,
    SelfReportsComponent,
    TopSellersComponent,
  ],
  templateUrl: './sales-reports-page.html',
  styleUrl: './sales-reports-page.scss',
})
export class SalesReportsPage {
  private access = inject(AccessService);
  private reports = inject(ReportsService);
  private forecast = inject(ForecastService);

  // Context from AccessService
  readonly isMgrLike = signal(this.access.isManagerLike());
  readonly isRep = signal(this.access.isRep());
  readonly storeId = signal(this.access.currentStoreId());
  readonly userId = signal(this.access.currentUserId());

  // Filters
  readonly timeframe = signal<Timeframe>('MTD');
  readonly ownerId = signal<string | 'ALL'>(this.isRep() ? this.userId() : 'ALL');
  readonly range = signal<{ start: Date; end: Date } | null>(null);

  readonly storeName = computed(() => this.reports.storeName(this.storeId()));

  // Derived KPIs/Charts
  readonly kpis = computed(() =>
    this.reports.getKpis({
      storeId: this.storeId(),
      ownerId: this.isRep() ? this.userId() : (this.ownerId() === 'ALL' ? undefined : this.ownerId()),
      timeframe: this.timeframe(),
      range: this.range(),
    })
  );

  readonly charts = computed(() =>
    this.reports.getCharts({
      storeId: this.storeId(),
      ownerId: this.isRep() ? this.userId() : (this.ownerId() === 'ALL' ? undefined : this.ownerId()),
      timeframe: this.timeframe(),
      range: this.range(),
    })
  );

  // Optional pre-warm
  private _warm = effect(() => {
    void this.timeframe(); void this.range(); void this.storeId(); void this.ownerId();
  });

  // ---- Template helpers / aliases to match existing HTML ----
  isManagerLike() { return this.isMgrLike(); }
  onTimeframe(tf: Timeframe) { this.timeframe.set(tf); }
  timeframeLabel(tf: Timeframe) {
    switch (tf) {
      case 'DTD': return 'Daily';
      case 'WTD': return 'Week to Date';
      case 'MTD': return 'Month to Date';
      case 'QTD': return 'Quarter to Date';
      case 'YTD': return 'Year to Date';
      default: return 'Custom';
    }
  }
  series() { return this.charts(); }
  openPipeline() {} // stub hook

  // Header text
  breadcrumb() { return `Location / ${this.storeName()} / Sales`; }
  title() { return this.isMgrLike() ? `Sales — Reports & Forecast — ${this.storeName()}` : `My Sales — Reports & Forecast`; }

  // Filter change (for shared time-filter, if you wire it)
  onFilterChange(evt: { timeframe: Timeframe; storeId?: string; ownerId?: string; range?: { start: Date; end: Date } | null }) {
    if (evt.storeId && evt.storeId !== this.storeId()) this.storeId.set(evt.storeId);
    if (evt.ownerId && evt.ownerId !== this.ownerId()) this.ownerId.set(evt.ownerId as any);
    if (evt.timeframe && evt.timeframe !== this.timeframe()) this.timeframe.set(evt.timeframe);
    this.range.set(evt.range ?? null);
  }

  refresh() { this.reports.bumpVersion(); }
}
