// src/app/features/portal/dashboard/portal-dashboard.page.ts
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
  selector: 'hog-portal-dashboard',
  imports: [
    CommonModule, RouterLink, NgOptimizedImage,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule, MatOptionModule,
    HogChartDirective
  ],
  templateUrl: './portal-dashboard.page.html',
  styleUrls: ['./portal-dashboard.page.scss']
})
export class PortalDashboardPage {
  private auth = inject(AuthService);

  private user(): User | null {
    const a: any = this.auth;
    return typeof a.user === 'function' ? a.user() : a.currentUser ?? null;
  }

  // Role scope
  privileged = computed(() => isPrivilegedGlobal(this.user()));
  hybrid     = computed(() => isHybrid(this.user()));
  canAll     = computed(() => canSeeAllLocations(this.user()));

  // Compare toggle (Admins/Owners)
  compareMode = signal<boolean>(false);
  toggleCompare() { this.compareMode.set(!this.compareMode()); }

  // Store visibility
  private allStores = mockStores;
  private assignedIds = computed<string[]>(() => userLocationIds(this.user()));
  visibleStores = computed<LocationRef[]>(() => {
    if (this.canAll()) return this.allStores;
    const allowed = new Set(this.assignedIds());
    return this.allStores.filter(s => allowed.has(s.id));
  });
  rolesAt = (id: string): Role[] => rolesForLocation(this.user(), id);

  // Filters
  activeStoreId = signal<string>(''); // '' = company-wide for OWNER/ADMIN
  onStore(id: string) { this.activeStoreId.set(id ?? ''); this.compareMode.set(false); }
  storeFilterList = () => this.visibleStores();

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

  // Scope helpers
  private currentStoreId = computed<string | null>(() => {
    if (!this.canAll() && !this.activeStoreId()) return this.assignedIds()[0] ?? null;
    return this.activeStoreId() || null; // '' -> null => company-wide
  });
  private isCompanyWide = computed(() => this.canAll() && !this.currentStoreId());
  scopeLabel = computed(() => this.isCompanyWide() ? 'Company-wide' : 'Store');

  // Sneak title
  sneakTitle = computed(() => {
    const id = this.currentStoreId();
    if (!id && this.canAll()) return 'All Stores (company-wide)';
    const store = this.allStores.find(s => s.id === id);
    return store ? `${store.name}` : 'Store';
  });

  // Link helpers (deep-link to a store or fallback)
  private activeOrFirstStoreId(): string | null {
    const id = this.currentStoreId();
    if (id) return id;
    return this.visibleStores()[0]?.id ?? null;
  }
  salesLink()      { const id = this.activeOrFirstStoreId(); return id ? ['/location', id, 'sales'] : ['/portal/reports']; }
  inventoryLink()  { const id = this.activeOrFirstStoreId(); return id ? ['/location', id, 'inventory'] : ['/portal/inventory']; }
  ticketsLink()    { const id = this.activeOrFirstStoreId(); return id ? ['/location', id, 'tickets'] : ['/portal/reports']; }
  deliveriesLink() { const id = this.activeOrFirstStoreId(); return id ? ['/location', id, 'deliveries'] : ['/portal/reports']; }
  serviceLink()    { const id = this.activeOrFirstStoreId(); return id ? ['/location', id, 'service'] : ['/portal/reports']; }
  rentalsLink()    { const id = this.activeOrFirstStoreId(); return id ? ['/location', id, 'rentals'] : ['/portal/reports']; }
  reportsLink()    { return ['/portal/reports']; }

  // ========= DEMO DATA (timeframe-reactive) =========
  // KPI baselines per timeframe (company vs typical-store)
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

  // pick KPI block by scope/timeframe
  private kpi = computed(() => {
    const tf = this.timeframe();
    const block = this.isCompanyWide() ? this.KPI_COMPANY[tf] : this.KPI_STORE[tf];
    return block;
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

  // Pipeline baselines (counts shrink by timeframe granularity)
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

  // Ticket counts
  tickets = computed(() => {
    const isCo = this.isCompanyWide();
    const tf = this.timeframe();
    const base = isCo ? { h: 8, m: 22, l: 31, sla: 2 } : { h: 3, m: 9, l: 12, sla: 1 };
    const mul  = ({ DTD: 0.8, WTD: 1, MTD: 1.4, QTD: 2.6, YTD: 4.5 } as Record<TF, number>)[tf];
    const r = (n:number) => Math.max(0, Math.round(n*mul));
    return { high: r(base.h), med: r(base.m), low: r(base.l), slaBreaches: r(base.sla) };
  });

  // Trends: meaningful to HOG mix
  private trendsSeries = computed(() => {
    const tf = this.timeframe();
    // Build 6 points for simplicity across any tf
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

  // Best sellers (6 cards: carts focus + shed + furniture), per-scope sample
  bestSellersRich = computed(() => {
    const mult = this.isCompanyWide() ? 1 : 0.6;
    return [
      { name: 'Evolution D5 Maverick 4', brand: 'Evolution', img: '/assets/demo/carts/evolution-d5.jpg',         price: 9995,  count: Math.round(12*mult) },
      { name: 'Evolution Forester 6',    brand: 'Evolution', img: '/assets/demo/carts/evolution-forester-6.jpg', price: 12995, count: Math.round(10*mult) },
      { name: 'Denago Rover S',          brand: 'Denago',    img: '/assets/demo/carts/denago-rover.jpg',         price: 8995,  count: Math.round(9*mult)  },
      { name: 'Dash Elite 48V',          brand: 'Dash',      img: '/assets/demo/carts/dash-elite.jpg',           price: 7995,  count: Math.round(8*mult)  },
      { name: '12x16 Barn Shed',         brand: 'HOP',       img: '/assets/demo/sheds/12x16-barn.jpg',           price: 4899,  count: Math.round(7*mult)  },
      { name: 'Poly Adirondack Chair',   brand: 'HOP',       img: '/assets/demo/furniture/adirondack.jpg',       price: 299,   count: Math.round(18*mult) },
    ];
  });
  topSeller = computed(() => this.bestSellersRich()[0]);

  // Deliveries calendar (Mon-Sun) including product name
  deliveryCalendar = computed(() => {
    const items = (label:string, entries:any[]) => ({ label, items: entries });
    const co = this.isCompanyWide();
    return [
      items('Mon', [{ time: '9:00a',  truck: 'A', driver: 'Aiden F.',  product: co ? '12x16 Barn Shed' : 'Evolution D5' }]),
      items('Tue', [{ time: '10:00a', truck: 'B', driver: 'Mike R.',   product: co ? 'Poly Playset A3' : 'Dash Elite 48V' }]),
      items('Wed', [{ time: '1:30p',  truck: 'C', driver: 'Sara L.',   product: 'Club Car 48V (refurb)' }]),
      items('Thu', [{ time: '11:00a', truck: 'A', driver: 'Team',      product: 'EZGO RXV' }]),
      items('Fri', [{ time: '2:00p',  truck: 'B', driver: 'Dispatch',  product: '12x20 Garage' }]),
      items('Sat', [{ time: '9:00a',  truck: 'A', driver: 'Aiden F.',  product: 'Evolution Forester 6' }]),
      items('Sun', []),
    ];
  });

  // Service overview counts + list
  service = computed(() => {
    const isCo = this.isCompanyWide();
    return { open: isCo ? 17 : 6, progress: isCo ? 11 : 4, parts: isCo ? 5 : 2, techs: isCo ? 9 : 3 };
  });
  serviceJobs = computed(() => {
    // CRM-style rows
    const rows = [
      { id: 4312, sev: 'High',   status: 'In Progress',    title: 'Brake adjustment', asset: 'EZGO RXV #112',      tech: 'D. Carter', eta: 'Today 4:30p' },
      { id: 4313, sev: 'Medium', status: 'Waiting Parts',  title: 'Battery check',    asset: 'Club Car 48V #77',   tech: 'L. Nguyen', eta: 'Tomorrow'    },
      { id: 4314, sev: 'Low',    status: 'Open',           title: 'Detail & prep',    asset: '12x16 Barn Shed',     tech: 'K. Patel',  eta: 'Fri'         },
    ];
    const rank: any = { High: 0, Medium: 1, Low: 2 };
    return rows.sort((a,b) => rank[a.sev]-rank[b.sev]);
  });

  // Rentals summary + imagery cards
  rentals = computed(() => {
    const isCo = this.isCompanyWide();
    return { out: isCo ? 13 : 4, dueToday: isCo ? 3 : 1, overdue: isCo ? 1 : 0 };
  });
  rentalsRich = computed(() => [
    { name: 'D5 Maverick 4', brand: 'Evolution', img: '/assets/demo/rentals/evolution-d5.jpg', due: 'Today 4:00p' },
    { name: 'E-Bike City 1', brand: 'Denago',    img: '/assets/demo/rentals/denago-city.jpg',   due: 'Tomorrow'   },
  ]);

  // Inventory: CRM low-stock table
  invScopeTitle = computed(() => {
    const id = this.currentStoreId();
    if (!id && this.canAll()) return 'Selected Scope (All Stores)';
    const store = this.allStores.find(s => s.id === id);
    return store ? `${store.name} Inventory` : 'Inventory';
  });

  invRows = computed(() => {
    const id = this.currentStoreId();
    // Mentor store id '3' only carts + parts
    if (id === '3') {
      return [
        { category: 'Golf Carts',            sub: 'Evolution / Denago / Dash', count: 42,  lowAt: 35 },
        { category: 'Parts & Accessories',   sub: 'Batteries / Tires',         count: 120, lowAt: 90 },
      ].map(r => ({ ...r, low: r.count <= r.lowAt }));
    }
    // Others: broader lines
    return [
      { category: 'Sheds & Garages',        sub: '10x12 / 12x16 / 10x20',      count: 68,  lowAt: 30 },
      { category: 'Playsets & Trampolines', sub: 'A3 / B2 / 12ft',             count: 54,  lowAt: 25 },
      { category: 'Golf Carts',             sub: 'Evolution / Denago / Dash',  count: 35,  lowAt: 30 },
      { category: 'Cabins & Structures',    sub: '12x24 / 14x28',              count: 22,  lowAt: 18 },
      { category: 'Parts & Accessories',    sub: 'Common SKUs',                count: 210, lowAt: 160 },
    ].map(r => ({ ...r, low: r.count <= r.lowAt }));
  });

  // Employee performance extras ($ impacts + why)
  perf = computed(() => ({
    topSales: 'S. Harper',
    trending: 'J. Kim',
    topSupport: 'M. Garcia',
    topDelivery: 'R. Brooks',
    topTech: 'A. Singh',
  }));
  perfReasons = computed(() => ({
    sales: 'Highest close rate & AOV this period',
    trending: 'Pipeline velocity up 35% with 3 closes',
    support: 'Most SLAs met; fastest first response',
    delivery: 'Most on-time routes; least re-dispatches',
    tech: 'Highest first-fix rate; minimal callbacks',
  }));
  perfWhyStats = computed(() => ({
    sales:    'Close 41% • AOV +$180 vs prev • 9 closes',
    trending: 'Velocity +35% • 3 wins • 0 lost',
    support:  'SLA met 98% • FRT 12m • CSAT 4.8',
    delivery: 'On-time 97% • Routes 22 • Re-dispatch 0',
    tech:     'First-fix 92% • Jobs/day 6.1 • Callbacks 1',
  }));
  perfBars = computed(() => ({ sales: 92, trending: 78, support: 88, delivery: 85, tech: 90 }));
  perfDollars = computed(() => {
    // Rough $$ impact demo: service time saved (hours * $85/hr), sales effectiveness (delta AOV * orders)
    const svcHoursSaved = this.isCompanyWide() ? 46 : 14;
    const serviceSavings = svcHoursSaved * 85;
    const salesLift = Math.max(0, (this.aov() - this.prevAov())) * this.orders();
    return { serviceSavings, salesLift };
  });

  // ========= CHART CONFIGS (computed so timeframe/scope updates re-render) =========
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
        }
      },
      grid: { borderColor: '#eee' },
    };
  });

  opportunityChart = computed(() => {
    // potential $ ~ pipeline weighted by AOV
    const p = this.pipelineData();
    const pot = [p.leads*0.1, p.q*0.2, p.quoted*0.4, p.verbal*0.7, p.closed*1.0].map(v => Math.round(v * (this.aov()/1000)));
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
      legend: { position: 'bottom' }
    };
  });

  // Compare row cards (per store)
  allStoresCompare = () => this.allStores;
  compareSales = (id: string) => {
    const base = this.KPI_STORE[this.timeframe()].total;
    const mult = (parseInt(id,10) || 1) * 0.6; // deterministic
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

  // ========= helpers =========
  private deltaPct(prev: number, cur: number) {
    if (!prev) return 0;
    return Math.round(((cur - prev) / prev) * 100);
  }
  private axisFromTF(): string[] {
    const tf = this.timeframe();
    switch (tf) {
      case 'DTD': return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; // 7 days
      case 'WTD': return ['Week 1','Week 2','Week 3','Week 4'];       // 4 weeks
      case 'QTD': return ['Month 1','Month 2','Month 3','Month 4'];   // 4 months
      case 'YTD': return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; // 12 months
      case 'MTD':
      default:    return ['W1','W2','W3','W4','W5'];                   // ~5 week buckets in month
    }
  }
  private seriesFromKpi(): number[] {
    // Build series length to match axis length
    const axis = this.axisFromTF();
    const n = axis.length;
    const total = this.totalSales();
    const base = total / n;
    const wobble = { DTD: 0.18, WTD: 0.15, MTD: 0.12, QTD: 0.10, YTD: 0.08 }[this.timeframe()];
    const out:number[] = [];
    for (let i=0;i<n;i++) {
      const v = base * (1 + Math.sin(i/1.7) * wobble);
      out.push(Math.round(v));
    }
    return out;
  }

  imgFallback(e: Event) {
    const el = e.target as HTMLImageElement;
    el.style.display = 'none';
  }
}
