import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';

import { AuthService } from '../../../core/auth/auth.service';
import type { User } from '../../../types/user.types';
import type { Role } from '../../../types/role.types';
import { mockStores, type LocationRef } from '../../../mock/locations.mock';

import {
  isPrivilegedGlobal, isHybrid, canSeeAllLocations,
  userLocationIds, rolesForLocation
} from '../../../core/auth/roles.util';

import { HogChartDirective } from '../../../shared/ui/chart/hog-chart.directive';

type TF = 'MTD'|'WTD'|'DTD'|'YTD'|'QTD';

@Component({
  standalone: true,
  selector: 'hog-reports',
  imports: [
    CommonModule, RouterLink, NgOptimizedImage,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule, MatOptionModule,
    HogChartDirective
  ],
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss']
})
export class ReportsPage {
  private auth = inject(AuthService);

  private user(): User | null {
    const a: any = this.auth;
    return typeof a.user === 'function' ? a.user() : a.currentUser ?? null;
  }

  // ===== Role scope =====
  privileged = computed(() => isPrivilegedGlobal(this.user()));
  hybrid     = computed(() => isHybrid(this.user()));
  canAll     = computed(() => canSeeAllLocations(this.user()));

  // ===== Stores / Visibility =====
  private allStores = mockStores;
  private assignedIds = computed<string[]>(() => userLocationIds(this.user()));
  visibleStores = computed<LocationRef[]>(() => {
    if (this.canAll()) return this.allStores;
    const allowed = new Set(this.assignedIds());
    return this.allStores.filter(s => allowed.has(s.id));
  });
  rolesAt = (id: string): Role[] => rolesForLocation(this.user(), id);

  // ===== Filters =====
  activeStoreId = signal<string>(''); // '' => company-wide (privileged users)
  onStore(id: string) { this.activeStoreId.set(id ?? ''); this.compareMode.set(false); }

  timeframe = signal<TF>('MTD');
  onTimeframe(tf: TF) { this.timeframe.set(tf); }

  timeframeLabel = computed(() => {
    switch (this.timeframe()) {
      case 'MTD': return 'month';
      case 'WTD': return 'week';
      case 'DTD': return 'day';
      case 'YTD': return 'year';
      case 'QTD': return 'quarter';
    }
  });

  private currentStoreId = computed<string | null>(() => {
    if (!this.canAll() && !this.activeStoreId()) return this.assignedIds()[0] ?? null;
    return this.activeStoreId() || null; // '' -> null => company-wide
  });
  private isCompanyWide = computed(() => this.canAll() && !this.currentStoreId());
  scopeLabel = computed(() => this.isCompanyWide() ? 'Company-wide' : 'Store');

  // ===== Compare Stores (like Dashboard) =====
  compareMode = signal<boolean>(false);
  toggleCompare() { this.compareMode.set(!this.compareMode()); }
  allStoresCompare = () => this.allStores;
  compareSales = (id: string) => {
    const base = this.KPI_STORE[this.timeframe()].total;
    const mult = (parseInt(id,10) || 1) * 0.6;
    return Math.round(base * mult / 1.8);
  };
  compareOrders = (id: string) => {
    const base = this.KPI_STORE[this.timeframe()].orders;
    const mult = (parseInt(id,10) || 1);
    return Math.max(1, Math.round(base * (0.7 + 0.1*mult)));
  };
  compareSalesChart = (id: string) => ({
    chart: { type: 'bar', height: 150, toolbar: { show: false } },
    series: [{ name: 'Sales', data: [Math.round(this.compareSales(id)*0.8), this.compareSales(id)] }],
    xaxis: { categories: ['Prev', 'Current'] },
    dataLabels: { enabled: false },
    grid: { borderColor: '#eee' },
  });

  // ===== KPI baselines =====
  private KPI_COMPANY: Record<TF, any> = {
    DTD: { total:  7200, prev:  6400, aov: 4200, aovPrev: 4000, orders:  7, ordersPrev: 6, refund: 1.4 },
    WTD: { total: 38400, prev: 35600, aov: 4150, aovPrev: 3980, orders:  9, ordersPrev: 8, refund: 1.6 },
    MTD: { total:182400, prev:168900, aov: 4100, aovPrev: 3950, orders: 43, ordersPrev:38, refund: 1.8 },
    QTD: { total:502300, prev:471900, aov: 4050, aovPrev: 3920, orders:121, ordersPrev:112, refund: 1.7 },
    YTD: { total:991800, prev:934200, aov: 4020, aovPrev: 3890, orders:247, ordersPrev:233, refund: 1.9 },
  };
  private KPI_STORE: Record<TF, any> = {
    DTD: { total: 1900, prev: 1600, aov: 3950, aovPrev: 3820, orders:  2, ordersPrev: 2, refund: 1.2 },
    WTD: { total:  9600, prev:  8200, aov: 3920, aovPrev: 3800, orders:  3, ordersPrev: 2, refund: 1.3 },
    MTD: { total: 55200, prev: 49800, aov: 3900, aovPrev: 3720, orders: 12, ordersPrev:10, refund: 1.5 },
    QTD: { total:152600, prev:141200, aov: 3880, aovPrev: 3710, orders: 39, ordersPrev:35, refund: 1.5 },
    YTD: { total:297400, prev:279100, aov: 3860, aovPrev: 3700, orders: 77, ordersPrev:72, refund: 1.6 },
  };

  private kpi = computed(() => {
    const tf = this.timeframe();
    return this.isCompanyWide() ? this.KPI_COMPANY[tf] : this.KPI_STORE[tf];
  });

  // KPI signals
  totalSales     = computed(() => this.kpi().total);
  prevTotalSales = computed(() => this.kpi().prev);
  salesDelta     = computed(() => this.deltaPct(this.prevTotalSales(), this.totalSales()));
  aov            = computed(() => this.kpi().aov);
  prevAov        = computed(() => this.kpi().aovPrev);
  orders         = computed(() => this.kpi().orders);
  prevOrders     = computed(() => this.kpi().ordersPrev);
  ordersDelta    = computed(() => this.deltaPct(this.prevOrders(), this.orders()));
  refundRate     = computed(() => this.kpi().refund.toFixed(1));

  // ===== Pipeline / Tickets / Trends =====
  private pipelineData = computed(() => {
    const isCo = this.isCompanyWide();
    const tf = this.timeframe();
    const base = isCo
      ? { leads: 360, q: 240, quoted: 165, verbal: 98, closed: 52 }
      : { leads: 120, q:  82, quoted:  55, verbal: 30, closed: 18 };
    const scale = ({ DTD: 0.15, WTD: 0.45, MTD: 1, QTD: 2.1, YTD: 3.8 } as Record<TF, number>)[tf];
    const round = (n:number) => Math.max(1, Math.round(n * scale));
    return {
      leads:  round(base.leads),
      q:      round(base.q),
      quoted: round(base.quoted),
      verbal: round(base.verbal),
      closed: round(base.closed),
    };
  });

  tickets = computed(() => {
    const isCo = this.isCompanyWide();
    const tf = this.timeframe();
    const base = isCo ? { h: 8, m: 22, l: 31, sla: 2 } : { h: 3, m: 9, l: 12, sla: 1 };
    const mul  = ({ DTD: 0.8, WTD: 1, MTD: 1.4, QTD: 2.6, YTD: 4.5 } as Record<TF, number>)[tf];
    const r = (n:number) => Math.max(0, Math.round(n*mul));
    return { high: r(base.h), med: r(base.m), low: r(base.l), slaBreaches: r(base.sla) };
  });

  private trendsSeries = computed(() => {
    const tf = this.timeframe();
    const sheds   = this.isCompanyWide() ? [52, 58, 64, 61, 67, 70] : [15, 18, 20, 19, 22, 24];
    const carts   = this.isCompanyWide() ? [40, 44, 49, 55, 63, 68] : [12, 14, 16, 18, 21, 24];
    const play    = this.isCompanyWide() ? [28, 30, 29, 33, 37, 40] : [9, 10, 10, 12, 13, 14];
    const cabins  = this.isCompanyWide() ? [14, 16, 18, 19, 21, 22] : [4, 5, 6, 6, 7, 7];
    const cats = ({
      DTD: ['Mon','Tue','Wed','Thu','Fri','Sat'],
      WTD: ['W1','W2','W3','W4','W5','W6'],
      MTD: ['W1','W2','W3','W4','W5','W6'],
      QTD: ['M1','M2','M3','M4','M5','M6'],
      YTD: ['Q1','Q2','Q3','Q4','Q5','Q6'],
    } as Record<TF,string[]>)[tf];
    return { sheds, carts, play, cabins, cats };
  });

  // ===== CHART CONFIGS (computed) =====
  salesChart = computed(() => ({
    chart: { type: 'line', height: 260, toolbar: { show: false } },
    series: [{ name: 'Sales', data: this.seriesFromKpi() }],
    xaxis: { categories: this.axisFromTF() },
    dataLabels: { enabled: false },
    stroke: { width: 3, curve: 'smooth' },
    grid: { borderColor: '#eee' },
  }));

  pipelineChart = computed(() => {
    const p = this.pipelineData();
    const seriesData = [
      { x: 'Leads', y: p.leads },
      { x: 'Qualified', y: p.q },
      { x: 'Quoted', y: p.quoted },
      { x: 'Verbal Yes', y: p.verbal },
      { x: 'Closed', y: p.closed },
    ];
    const max = seriesData.reduce((m, d) => Math.max(m, d.y), 0);
    return {
      chart: { type: 'bar', height: 260, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 4 } },
      series: [{ data: seriesData }],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => {
          const pct = max ? Math.round((val / max) * 100) : 0;
          return `${val} • ${pct}%`;
        },
      },
      grid: { borderColor: '#eee' },
    };
  });

  opportunityChart = computed(() => {
    const p = this.pipelineData();
    const pot = [p.leads*0.1, p.q*0.2, p.quoted*0.4, p.verbal*0.7, p.closed*1.0]
      .map(v => Math.round(v * (this.aov()/1000)));
    return {
      chart: { type: 'area', height: 260, toolbar: { show: false } },
      series: [{ name: 'Potential $', data: pot }],
      xaxis: { categories: ['Leads','Qualified','Quoted','Verbal','Closed'] },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      grid: { borderColor: '#eee' },
    };
  });

  trendChart = computed(() => {
    const t = this.trendsSeries();
    return {
      chart: { type: 'area', height: 220, toolbar: { show: false } },
      series: [
        { name: 'Sheds index',       data: t.sheds },
        { name: 'Golf carts index',  data: t.carts },
        { name: 'Playsets index',    data: t.play },
        { name: 'Cabins index',      data: t.cabins },
      ],
      xaxis: { categories: t.cats },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      grid: { borderColor: '#eee' },
    };
  });

  ticketsChart = computed(() => {
    const t = this.tickets();
    return {
      chart: { type: 'donut', height: 240, toolbar: { show: false } },
      series: [ t.high, t.med, t.low ],
      labels: ['High','Medium','Low'],
      legend: { position: 'bottom' },
    };
  });

  // ===== Top Performers per Location (links use /s1|s2|s3) =====
  // PUBLIC because template calls it
  storeSlug(id: string): string {
    switch (id) {
      case '1': return 's1';
      case '2': return 's2';
      case '3': return 's3';
      default:  return `s${id}`;
    }
  }
  // Template helper for "Open {slug}" button (goes to /sX/page)
  storePageLink(id: string) {
    return ['/', this.storeSlug(id), 'page'];
  }
  // Per-dept deep links still available if you use them in the template
  performerLink(id: string, page: string) {
    return ['/', this.storeSlug(id), page];
  }

  performerDeck = computed(() => {
    const names = ['S. Harper','J. Kim','A. Singh','M. Garcia','R. Brooks','K. Patel','D. Carter','L. Nguyen'];
    const pick = (storeId: string, offset: number) => {
      const num = Number.parseInt(storeId, 10) || 0;
      return names[(num + offset) % names.length];
    };
    const pct = (seed: number) => Math.min(100, Math.max(60, 72 + (seed % 28)));
    const why = (dept: string, seed: number) => {
      const bars = ['AOV +$180','Velocity +35%','SLA 98%','On-time 97%','First-fix 92%'];
      return `${dept} • ${bars[seed % bars.length]}`;
    };

    return this.visibleStores().map(s => ({
      id: s.id, name: s.name,
      roles: this.rolesAt(s.id),
      links: {
        dashboard: this.performerLink(s.id, 'dashboard'),
        sales:     this.performerLink(s.id, 'sales'),
        tickets:   this.performerLink(s.id, 'tickets'),
        inventory: this.performerLink(s.id, 'inventory'),
      },
      sales:     { who: pick(s.id, 1), bar: pct(+s.id*3),  why: why('Sales',     +s.id)   },
      trending:  { who: pick(s.id, 2), bar: pct(+s.id*5),  why: why('Trending',  +s.id+1) },
      support:   { who: pick(s.id, 3), bar: pct(+s.id*7),  why: why('Support',   +s.id+2) },
      delivery:  { who: pick(s.id, 4), bar: pct(+s.id*9),  why: why('Delivery',  +s.id+3) },
      tech:      { who: pick(s.id, 5), bar: pct(+s.id*11), why: why('Tech',      +s.id+4) },
    }));
  });

  // ===== Generic links (fallbacks) =====
  private activeOrFirstStoreId(): string | null {
    const id = this.currentStoreId();
    if (id) return id;
    return this.visibleStores()[0]?.id ?? null;
  }
  salesLink()      { const id = this.activeOrFirstStoreId(); return id ? ['/location', id, 'sales']      : ['/portal/reports']; }
  inventoryLink()  { const id = this.activeOrFirstStoreId(); return id ? ['/location', id, 'inventory']  : ['/portal/inventory']; }
  ticketsLink()    { const id = this.activeOrFirstStoreId(); return id ? ['/location', id, 'tickets']    : ['/portal/reports']; }
  reportsLink()    { return ['/portal/reports']; }

  // ===== helpers =====
  private deltaPct(prev: number, cur: number) {
    if (!prev) return 0;
    return Math.round(((cur - prev) / prev) * 100);
  }
  private axisFromTF(): string[] {
    const tf = this.timeframe();
    switch (tf) {
      case 'DTD': return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      case 'WTD': return ['Week 1','Week 2','Week 3','Week 4'];
      case 'QTD': return ['Month 1','Month 2','Month 3','Month 4'];
      case 'YTD': return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      case 'MTD':
      default:    return ['W1','W2','W3','W4','W5'];
    }
  }
  private seriesFromKpi(): number[] {
    const axis = this.axisFromTF();
    const n = axis.length;
    const total = this.totalSales();
    const base = total / n;
    const wobble = { DTD: 0.18, WTD: 0.15, MTD: 0.12, QTD: 0.10, YTD: 0.08 }[this.timeframe()];
    const out:number[] = [];
    for (let i=0;i<n;i++) out.push(Math.round(base * (1 + Math.sin(i/1.7) * wobble)));
    return out;
  }

  imgFallback(e: Event) {
    const el = e.target as HTMLImageElement;
    el.style.display = 'none';
  }
}
