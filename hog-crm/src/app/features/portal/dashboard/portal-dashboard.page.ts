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
import { HogChartDirective } from '../../../shared/ui/chart/hog-chart.directive';

import { AuthService } from '../../../core/auth/auth.service';
import type { User } from '../../../types/user.types';
import type { Role } from '../../../types/role.types';
import { mockStores, type LocationRef } from '../../../mock/locations.mock';
import {
  isPrivilegedGlobal, isHybrid, canSeeAllLocations,
  userLocationIds, rolesForLocation
} from '../../../core/auth/roles.util';

// NEW: deterministic profiles + seed utils
import { storeProfiles, profileFor } from '../../../mock/store-profiles.mock';
import { makeSeed, tfScale, seasonalityFactor, TF } from '../../../shared/demo/seed.util';

type Kpi = { total:number; prev:number; orders:number; ordersPrev:number; aov:number; aovPrev:number; refund:number };

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

  // Stores visibility based on auth
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

  // ========= PROFILES & DETERMINISTIC KPIs =========

  // Map mockStores (ids like "1","2","3"?) to profile ids ("s1","s2","s3")
  private toProfileId(id: string | null): string | null {
    if (!id) return null;
    return id.startsWith('s') ? id : `s${id}`; // tolerate both forms
  }

  private kpisByStore = computed<Record<string, Kpi>>(() => {
    const tf = this.timeframe();
    const month = new Date().getMonth();
    const out: Record<string, Kpi> = {};
    // Only include visible stores for this user (auth-aware)
    for (const s of this.visibleStores()) {
      const pid = this.toProfileId(s.id)!;
      const p = profileFor(pid);
      const r = makeSeed(`${pid}|${tf}|KPI`);
      const baseOrders = 12;
      const orders = Math.max(1, Math.round(baseOrders * tfScale(tf) * p.demandIndex * (0.9 + r()*0.3)));
      const aov = Math.round(3600 + (r()*600) * (p.mix.carts*1.1 + p.mix.sheds*0.9 + p.mix.parts*0.6));
      const total = Math.round(orders * aov * seasonalityFactor(month, p.seasonality));
      const prev  = Math.round(total * (0.90 + r()*0.10));
      const ordersPrev = Math.max(1, Math.round(orders * (0.85 + r()*0.20)));
      const aovPrev = aov - 120;
      const refund = +(1.2 + r()*0.8).toFixed(1);
      out[s.id] = { total, prev, orders, ordersPrev, aov, aovPrev, refund };
    }
    return out;
  });

  private companyKpi = computed<Kpi>(() => {
    // Aggregate across visible stores
    const all = Object.values(this.kpisByStore());
    const sum = (k: keyof Kpi) => all.reduce((acc, v) => acc + (v[k] as number), 0);
    if (!all.length) return { total:0, prev:0, orders:0, ordersPrev:0, aov:0, aovPrev:0, refund:1.2 };
    // AOV/AOVPrev as weighted by orders
    const orders = sum('orders');
    const aov = Math.round(orders ? all.reduce((acc, v) => acc + v.aov * v.orders, 0) / orders : 0);
    const ordersPrev = sum('ordersPrev');
    const aovPrev = Math.round(ordersPrev ? all.reduce((acc, v) => acc + v.aovPrev * v.ordersPrev, 0) / ordersPrev : 0);
    return {
      total: sum('total'),
      prev:  sum('prev'),
      orders,
      ordersPrev,
      aov,
      aovPrev,
      refund: +(all.reduce((a,v)=>a+v.refund,0)/all.length).toFixed(1),
    };
  });

  private storeKpi = computed<Kpi>(() => {
    const id = this.currentStoreId();
    if (!id) return this.companyKpi(); // fallback if no store in scope
    const m = this.kpisByStore()[id];
    return m ?? { total:0, prev:0, orders:0, ordersPrev:0, aov:0, aovPrev:0, refund:1.2 };
  });

  // pick KPI block by scope/timeframe
  private kpi = computed(() => this.isCompanyWide() ? this.companyKpi() : this.storeKpi());

  // KPI signals (hero stats)
  totalSales     = computed(() => this.kpi().total);
  prevTotalSales = computed(() => this.kpi().prev);
  salesDelta     = computed(() => this.deltaPct(this.prevTotalSales(), this.totalSales()));
  aov            = computed(() => this.kpi().aov);
  prevAov        = computed(() => this.kpi().aovPrev);
  orders         = computed(() => this.kpi().orders);
  prevOrders     = computed(() => this.kpi().ordersPrev);
  ordersDelta    = computed(() => this.deltaPct(this.prevOrders(), this.orders()));
  refundRate     = computed(() => this.kpi().refund.toFixed(1));

  // ========= STORE HEALTH HEATMAP (HQ only) =========
  // Rows: one per visible store; Cols: Sales Δ, AOV Δ, On-time Δ, SLA Δ
  // On-time/SLA are seeded, but scaled by deliveryCapacity/serviceComplexity.
  storeHealthRows = computed(() => {
    const tf = this.timeframe();
    const rows: Array<{
      id: string; name: string;
      salesDelta: number; aovDelta: number; onTimeDelta: number; slaDelta: number;
    }> = [];
    for (const s of this.visibleStores()) {
      const pid = this.toProfileId(s.id)!;
      const p = profileFor(pid);
      const k = this.kpisByStore()[s.id];
      const r = makeSeed(`${pid}|${tf}|HEALTH`);
      const salesDelta = this.deltaPct(k?.prev ?? 0, k?.total ?? 0);
      const aovDelta   = this.deltaPct(k?.aovPrev ?? 0, k?.aov ?? 0);
      // Base deltas ± scaled by capacity/complexity (bounded)
      const onTimeDelta = Math.round(((r()*10)-5) * p.deliveryCapacity * 1.2);
      const slaDelta    = Math.round(((r()*10)-5) * (2 - p.serviceComplexity) * 1.1);
      rows.push({ id: s.id, name: s.name, salesDelta, aovDelta, onTimeDelta, slaDelta });
    }
    return rows;
  });

  // ========= COMPARE STRIP (Prev vs Current, per store) =========
  // Provide mini-series for small bar/line charts
  compareStores = () => this.visibleStores();
  compareSeriesFor = (id: string) => {
    const k = this.kpisByStore()[id];
    const prev = Math.max(1, Math.round((k?.prev ?? 0)));
    const cur  = Math.max(1, Math.round((k?.total ?? 0)));
    return [prev, cur];
  };
  compareOrdersFor = (id: string) => {
    const k = this.kpisByStore()[id];
    return [k?.ordersPrev ?? 0, k?.orders ?? 0];
    // (bind to two tiny bars or a line in your template)
  };

  // ========= PIPELINE / TICKETS / OTHER (retain your existing layout) =========
  // These now scale deterministically from KPIs instead of hardcoded blocks.
  private pipelineData = computed(() => {
    const k = this.kpi();
    // simple shape: more orders => more pipeline; timeframe already baked into orders via tfScale
    const base = Math.max(1, k.orders);
    const leads   = Math.max(1, Math.round(base * 30 / 7));
    const q       = Math.max(1, Math.round(leads * 0.66));
    const quoted  = Math.max(1, Math.round(q * 0.68));
    const verbal  = Math.max(1, Math.round(quoted * 0.60));
    const closed  = Math.max(1, Math.round(verbal * 0.53));
    return { leads, q, quoted, verbal, closed };
  });

  tickets = computed(() => {
    // derive from service complexity and orders volume
    const id = this.currentStoreId();
    const pid = this.toProfileId(id);
    const p = pid ? profileFor(pid) : null;
    const volume = Math.max(1, this.kpi().orders);
    const r = makeSeed(`${pid ?? 'co'}|${this.timeframe()}|TICKETS`);
    const base = (mult:number) => Math.max(0, Math.round(volume * mult * (0.9 + r()*0.3)));
    const svcMult = (p ? p.serviceComplexity : 1);
    return {
      high: base(0.12 * svcMult),
      med:  base(0.28 * svcMult),
      low:  base(0.36 * svcMult),
      slaBreaches: Math.max(0, Math.round(base(0.04) * (p ? (0.9 + (svcMult-1)) : 1)))
    };
  });

  // Category trends (kept compact; could be expanded)
  private trendsSeries = computed(() => {
    const id = this.currentStoreId();
    const pid = this.toProfileId(id);
    const p = pid ? profileFor(pid) : null;
    const mix = p?.mix ?? { carts:0.4, sheds:0.28, play:0.12, cabins:0.08, parts:0.12 };
    const base = Math.max(6, Math.round(this.kpi().orders / 2));
    const ds = (m:number) => [base*m*0.9, base*m, base*m*1.05, base*m*1.12, base*m*1.08, base*m*1.15].map(n=>Math.round(n));
    const cats = ({ DTD: ['Mon','Tue','Wed','Thu','Fri','Sat'],
                    WTD: ['W1','W2','W3','W4','W5','W6'],
                    MTD: ['W1','W2','W3','W4','W5','W6'],
                    QTD: ['M1','M2','M3','M4','M5','M6'],
                    YTD: ['Q1','Q2','Q3','Q4','Q5','Q6'] } as Record<TF,string[]>)[this.timeframe()];
    return {
      carts: ds(mix.carts),
      sheds: ds(mix.sheds),
      play:  ds(mix.play),
      cabins:ds(mix.cabins),
      cats
    };
  });

  // Best sellers (minor tweak: weight by mix)
  bestSellersRich = computed(() => {
    const id = this.currentStoreId();
    const pid = this.toProfileId(id);
    const p = pid ? profileFor(pid) : null;
    const mult = this.isCompanyWide() ? 1 : 0.6;
    const cartsWeight = (p?.mix.carts ?? 0.4);
    const shedsWeight = (p?.mix.sheds ?? 0.28);
    return [
      { name: 'Evolution D5 Maverick 4', brand: 'Evolution', img: '/assets/demo/carts/evolution-d5.jpg',         price: 9995,  count: Math.round(12*mult*cartsWeight*1.2) },
      { name: 'Evolution Forester 6',    brand: 'Evolution', img: '/assets/demo/carts/evolution-forester-6.jpg', price: 12995, count: Math.round(10*mult*cartsWeight*1.1) },
      { name: 'Denago Rover S',          brand: 'Denago',    img: '/assets/demo/carts/denago-rover.jpg',         price: 8995,  count: Math.round(9*mult*cartsWeight) },
      { name: 'Dash Elite 48V',          brand: 'Dash',      img: '/assets/demo/carts/dash-elite.jpg',           price: 7995,  count: Math.round(8*mult*cartsWeight)  },
      { name: '12x16 Barn Shed',         brand: 'HOP',       img: '/assets/demo/sheds/12x16-barn.jpg',           price: 4899,  count: Math.round(7*mult*shedsWeight)  },
      { name: 'Poly Adirondack Chair',   brand: 'HOP',       img: '/assets/demo/furniture/adirondack.jpg',       price: 299,   count: Math.round(18*mult*(p?.mix.parts ?? 0.12)) },
    ];
  });
  topSeller = computed(() => this.bestSellersRich()[0]);

  // Deliveries calendar: leave simple but deterministic by store
  deliveryCalendar = computed(() => {
    const id = this.currentStoreId();
    const pid = this.toProfileId(id);
    const p = pid ? profileFor(pid) : null;
    const cap = p?.deliveryCapacity ?? 1;
    const slots = Math.max(1, Math.round(5 * cap));
    const label = (d:string, n:number) => ({ label: d, items: Array.from({length: Math.min(n,3)}, (_,i)=>({
      time: `${9+i}:00a`, truck: ['A','B','C'][i%3], driver: ['Aiden F.','Mike R.','Sara L.'][i%3],
      product: ['Evolution D5','Poly Playset','12x16 Barn Shed','EZGO RXV'][i%4]
    }))});
    return [
      label('Mon', slots-2), label('Tue', slots-1), label('Wed', slots),
      label('Thu', slots-1), label('Fri', slots), label('Sat', Math.max(0, slots-3)),
      { label:'Sun', items: [] }
    ];
  });

  // Service summary (scaled by complexity)
  service = computed(() => {
    const id = this.currentStoreId();
    const pid = this.toProfileId(id);
    const p = pid ? profileFor(pid) : null;
    const mult = (p?.serviceComplexity ?? 1);
    const co = this.isCompanyWide();
    return { open: Math.round((co?17:6)*mult), progress: Math.round((co?11:4)*mult), parts: Math.round((co?5:2)*mult), techs: co?9:3 };
  });

  serviceJobs = computed(() => {
    const rows = [
      { id: 4312, sev: 'High',   status: 'In Progress',    title: 'Brake adjustment', asset: 'EZGO RXV #112',      tech: 'D. Carter', eta: 'Today 4:30p' },
      { id: 4313, sev: 'Medium', status: 'Waiting Parts',  title: 'Battery check',    asset: 'Club Car 48V #77',   tech: 'L. Nguyen', eta: 'Tomorrow'    },
      { id: 4314, sev: 'Low',    status: 'Open',           title: 'Detail & prep',    asset: '12x16 Barn Shed',     tech: 'K. Patel',  eta: 'Fri'         },
    ];
    const rank: any = { High: 0, Medium: 1, Low: 2 };
    return rows.sort((a,b) => rank[a.sev]-rank[b.sev]);
  });

  rentals = computed(() => {
    const k = this.kpi();
    const out = Math.max(1, Math.round(k.orders * 0.3));
    return { out, dueToday: Math.max(0, Math.round(out*0.2)), overdue: Math.max(0, Math.round(out*0.08)) };
  });
  rentalsRich = computed(() => [
    { name: 'D5 Maverick 4', brand: 'Evolution', img: '/assets/demo/rentals/evolution-d5.jpg', due: 'Today 4:00p' },
    { name: 'E-Bike City 1', brand: 'Denago',    img: '/assets/demo/rentals/denago-city.jpg',   due: 'Tomorrow'   },
  ]);

  // Inventory scope title (unchanged)
  invScopeTitle = computed(() => {
    const id = this.currentStoreId();
    if (!id && this.canAll()) return 'Selected Scope (All Stores)';
    const store = this.allStores.find(s => s.id === id);
    return store ? `${store.name} Inventory` : 'Inventory';
  });

  // Inventory rows: shape by mix; carts+parts heavy for s3 (Mentor)
  invRows = computed(() => {
    const id = this.currentStoreId();
    const pid = this.toProfileId(id);
    const p = pid ? profileFor(pid) : null;
    if (pid === 's3') {
      return [
        { category: 'Golf Carts',            sub: 'Evolution / Denago / Dash', count: 42,  lowAt: 35 },
        { category: 'Parts & Accessories',   sub: 'Batteries / Tires',         count: 120, lowAt: 90 },
      ].map(r => ({ ...r, low: r.count <= r.lowAt }));
    }
    // mix-weighted demo
    return [
      { category: 'Sheds & Garages',        sub: '10x12 / 12x16 / 10x20',      count: Math.round(40*(p?.mix.sheds ?? 0.28) + 40),  lowAt: 30 },
      { category: 'Playsets & Trampolines', sub: 'A3 / B2 / 12ft',             count: Math.round(35*(p?.mix.play  ?? 0.12) + 20),  lowAt: 25 },
      { category: 'Golf Carts',             sub: 'Evolution / Denago / Dash',  count: Math.round(30*(p?.mix.carts ?? 0.40) + 20),  lowAt: 30 },
      { category: 'Cabins & Structures',    sub: '12x24 / 14x28',              count: Math.round(20*(p?.mix.cabins?? 0.08) + 10),  lowAt: 18 },
      { category: 'Parts & Accessories',    sub: 'Common SKUs',                count: Math.round(80*(p?.mix.parts ?? 0.12) + 120), lowAt: 160 },
    ].map(r => ({ ...r, low: r.count <= r.lowAt }));
  });

  // Employee performance (unchanged text; now consistent with KPIs)
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
    const serviceSavings = 85 * (this.isCompanyWide() ? 46 : 14);
    const salesLift = Math.max(0, (this.aov() - this.prevAov())) * this.orders();
    return { serviceSavings, salesLift };
  });

  // ========= CHART CONFIGS (unchanged bindings, seeded data) =========
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
        { name: 'Golf carts index',  data: t.carts },
        { name: 'Sheds index',       data: t.sheds },
        { name: 'Playsets index',    data: t.play  },
        { name: 'Cabins index',      data: t.cabins},
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

  // ========= helpers =========
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
    const wobble = { DTD: 0.18, WTD: 0.15, MTD: 0.12, QTD: 0.10, YTD: 0.08 }[this.timeframe()];
    const r = makeSeed(`CO|${this.currentStoreId() ?? 'ALL'}|${this.timeframe()}|SERIES`);
    const out:number[] = [];
    for (let i=0;i<n;i++) {
      const v = (total / n) * (0.85 + r()*0.3) * (1 + Math.sin(i/1.7) * wobble);
      out.push(Math.round(v));
    }
    return out;
  }

  imgFallback(e: Event) {
    const el = e.target as HTMLImageElement;
    el.style.display = 'none';
  }
}
