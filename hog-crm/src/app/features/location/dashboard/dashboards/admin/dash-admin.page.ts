// src/app/features/location/dashboard/pages/admin/dash-admin.page.ts
import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, ParamMap, Router, RouterLink, NavigationEnd } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';

import { HogChartDirective } from '../../../../../shared/ui/chart/hog-chart.directive';
import { StatCardComponent } from '../../../../../shared/ui/stat-card/stat-card.component';
import { ToastService } from '../../../../../shared/services/toast.service';

import { mockStores, type LocationRef } from '../../../../../mock/locations.mock';

// NEW: store profiles + deterministic seed helpers
import { profileFor } from '../../../../../mock/store-profiles.mock';
import { makeSeed, seasonalityFactor, tfScale as tfScaleFn } from '../../../../../shared/demo/seed.util';

// Reactive route helpers
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, of } from 'rxjs';
import { map, filter, startWith } from 'rxjs/operators';

type TF = 'MTD'|'WTD'|'DTD'|'YTD'|'QTD';
type Kpi = { total:number; prev:number; orders:number; ordersPrev:number; aov:number; aovPrev:number; refund:number };

@Component({
  standalone: true,
  selector: 'hog-dash-admin',
  imports: [
    CommonModule, RouterLink, NgOptimizedImage,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule, MatOptionModule,
    HogChartDirective, StatCardComponent
  ],
  templateUrl: './dash-admin.page.html',
  styleUrls: ['./dash-admin.page.scss']
})
export class DashAdminPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  // -------- logging helpers --------
  private log(label: string, payload?: any) { try { console.log(`[DashAdmin] ${label}`, payload); } catch {} }
  private tap<T>(label: string, value: T): T { this.log(label, value); return value; }

  // ----- Resolve store id robustly -----
  private extractIdFromParamMap(pm: ParamMap | null): string | null {
    if (!pm) return null;
    for (const k of ['id','storeId','locationId','locId','sid']) {
      const v = pm.get(k);
      if (v) return v;
    }
    return null;
  }
  private extractIdFromUrl(url: string): string | null {
    try {
      const path = url.split('?')[0].split('#')[0];
      const segs = path.split('/').filter(Boolean); // e.g. ["location","3","dashboard","admin"]
      const i = segs.indexOf('location');
      if (i >= 0 && i + 1 < segs.length) {
        const id = segs[i + 1];
        // guard against accidental picks
        if (id && !['dashboard','admin','sales','tickets','inventory','deliveries','service','rentals','reports'].includes(id)) {
          return id;
        }
      }
    } catch {}
    return null;
  }

  // React to both paramMap changes and URL changes
  private urlId$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    startWith(null),
    map(() => this.extractIdFromUrl(this.router.url))
  );

  private idParam = toSignal(
    combineLatest([
      this.route.paramMap,
      this.route.parent ? this.route.parent.paramMap : of(null),
      this.route.parent?.parent ? this.route.parent.parent.paramMap : of(null),
      this.urlId$
    ]).pipe(
      map(([a,b,c,u]) => {
        const candidate = this.extractIdFromParamMap(a) ?? this.extractIdFromParamMap(b) ?? this.extractIdFromParamMap(c) ?? u;
        const finalId = candidate ?? mockStores[0]?.id ?? '';
        this.log('resolvedStoreId', { a: this.extractIdFromParamMap(a), b: this.extractIdFromParamMap(b), c: this.extractIdFromParamMap(c), url: u, finalId });
        return finalId;
      })
    ),
    { initialValue: mockStores[0]?.id ?? '' }
  );

  storeId   = computed(() => this.tap('storeId()', this.idParam()));
  store     = computed<LocationRef|undefined>(() => this.tap('store()', mockStores.find(s => s.id === this.storeId())));
  storeName = computed(() => this.tap('storeName()', this.store()?.name ?? `Store ${this.storeId()}`));

  private profileId = computed(() => {
    const id = this.storeId();
    const pool = ['s1','s2','s3'];
    if (!id) return this.tap('profileId()', 's1');
    const num = parseInt(id.replace(/\D/g, ''), 10);
    if (!Number.isNaN(num) && num >= 1) return this.tap('profileId()', pool[(num - 1) % pool.length]);
    let h = 2166136261 ^ id.length;
    for (let i=0;i<id.length;i++){ h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
    return this.tap('profileId()', pool[(h >>> 0) % pool.length]);
  });

  private profile = computed(() => this.tap('profile()', profileFor(this.profileId())));

  // ===== Timeframe =====
  timeframe = signal<TF>('MTD');
  onTimeframe(tf: TF) { this.log('onTimeframe()', tf); this.timeframe.set(tf); }
  timeframeLabel = computed(() => this.tap('timeframeLabel()', ({MTD:'month',WTD:'week',DTD:'day',YTD:'year',QTD:'quarter'} as const)[this.timeframe()]));

  // ===== Refresh =====
  private seedTick = signal(0);
  refresh(){ this.seedTick.update(v=>v+1); this.log('refresh()', { tick: this.seedTick() }); this.toast.success('Data refreshed'); }

  private rng(key: string) {
    const seedKey = `${this.storeId()}|${this.profileId()}|${this.timeframe()}|${key}|${this.seedTick()}`;
    const r = makeSeed(seedKey);
    this.log('rng(seedKey)', seedKey);
    return r;
  }
  private tfScale(): number { return this.tap('tfScale()', tfScaleFn(this.timeframe())); }

  // Per-store tiny bias so stores that share a profile still differ
  private storeBias = computed(() => {
    const r = makeSeed(`BIAS|${this.storeId()}`);
    const bias = 0.95 + r()*0.10;
    return this.tap('storeBias()', +bias.toFixed(4));
  });

  // Unique chart key so charts re-render when inputs change
  chartKey = computed(() => this.tap('chartKey()', `${this.storeId()}|${this.profileId()}|${this.timeframe()}|${this.seedTick()}`));

  // ===== KPIs =====
  private kpiBlock = computed<Kpi>(() => {
    const r = this.rng('KPI');
    const p = this.profile();
    const month = new Date().getMonth();
    const bias = this.storeBias();
    const noise = (lo=0.97, hi=1.05) => lo + (hi-lo) * r();

    const baseOrders = 12;
    const orders = Math.max(1, Math.round(baseOrders * this.tfScale() * p.demandIndex * bias * noise(0.97,1.05)));

    const mix = p.mix;
    const mixBoost = (mix.carts*0.35 + mix.sheds*0.18 + mix.play*0.06 + mix.cabins*0.04 - mix.parts*0.08);
    const aov = Math.round(3600 * (1 + mixBoost) * bias * noise(0.98,1.04));

    const total = Math.round(orders * aov * seasonalityFactor(month, p.seasonality));
    const prev = Math.round(total * (0.90 + r()*0.06));
    const ordersPrev = Math.max(1, Math.round(orders * (0.86 + r()*0.08)));
    const aovPrev = Math.max(800, Math.round(aov * (0.96 + r()*0.03)));
    const refund = +(1.2 + r()*0.8).toFixed(1);

    return this.tap('kpiBlock()', { total, prev, orders, ordersPrev, aov, aovPrev, refund });
  });

  totalSales     = computed(()=> this.tap('totalSales()', this.kpiBlock().total));
  prevTotalSales = computed(()=> this.tap('prevTotalSales()', this.kpiBlock().prev));
  salesDelta     = computed(()=> this.tap('salesDelta()', this.deltaPct(this.prevTotalSales(), this.totalSales())));
  orders         = computed(()=> this.tap('orders()', this.kpiBlock().orders));
  prevOrders     = computed(()=> this.tap('prevOrders()', this.kpiBlock().ordersPrev));
  ordersDelta    = computed(()=> this.tap('ordersDelta()', this.deltaPct(this.prevOrders(), this.orders())));
  aov            = computed(()=> this.tap('aov()', this.kpiBlock().aov));
  prevAov        = computed(()=> this.tap('prevAov()', this.kpiBlock().aovPrev));
  refundRate     = computed(()=> this.tap('refundRate()', this.kpiBlock().refund.toFixed(1)));

  // ===== Charts =====
  private axisFromTF(): string[] {
    const axis =
      this.timeframe()==='DTD' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] :
      this.timeframe()==='WTD' ? ['Week 1','Week 2','Week 3','Week 4'] :
      this.timeframe()==='QTD' ? ['Month 1','Month 2','Month 3','Month 4'] :
      this.timeframe()==='YTD' ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] :
                                 ['W1','W2','W3','W4','W5'];
    return this.tap('axisFromTF()', axis);
  }

  private buildSalesSeries(): number[] {
    const axis = this.axisFromTF();
    const n = axis.length;
    const total = this.totalSales();
    const wobble = ({DTD:0.18,WTD:0.15,MTD:0.12,QTD:0.10,YTD:0.08} as Record<TF,number>)[this.timeframe()];
    const r = this.rng('SERIES');
    const shift = Math.floor(r()*6);
    const out:number[] = [];
    for(let i=0;i<n;i++){
      const v = (total / n) * (0.9 + r()*0.2) * (1 + Math.sin((i+shift)/1.7)*wobble);
      out.push(Math.max(1, Math.round(v)));
    }
    return this.tap('buildSalesSeries()', out);
  }

  salesChart = computed(() => this.tap('salesChart()', ({
    chart: { id: this.chartKey(), type:'line', height:260, toolbar:{show:false}},
    series: [{ name: 'Sales', data: this.buildSalesSeries() }],
    xaxis: { categories: this.axisFromTF() },
    dataLabels:{enabled:false},
    stroke:{curve:'smooth', width:3},
    grid:{borderColor:'#eee'}
  })));

  private pipelineData = computed(() => {
    const base = Math.max(1, this.orders());
    const leads   = Math.max(1, Math.round(base * 30 / 7));
    const q       = Math.max(1, Math.round(leads * 0.66));
    const quoted  = Math.max(1, Math.round(q * 0.68));
    const verbal  = Math.max(1, Math.round(quoted * 0.60));
    const closed  = Math.max(1, Math.round(verbal * 0.53));
    return this.tap('pipelineData()', { leads, q, quoted, verbal, closed });
  });

  pipelineChart = computed(() => {
    const p = this.pipelineData();
    const seriesData = [
      {x:'Leads', y:p.leads}, {x:'Qualified', y:p.q},
      {x:'Quoted', y:p.quoted}, {x:'Verbal Yes', y:p.verbal}, {x:'Closed', y:p.closed},
    ];
    const max = seriesData.reduce((m,d)=>Math.max(m,d.y),0);
    return this.tap('pipelineChart()', {
      chart:{ id: this.chartKey(), type:'bar', height:260, toolbar:{show:false}},
      plotOptions:{bar:{horizontal:true, distributed:true, borderRadius:4}},
      series:[{data:seriesData}],
      dataLabels:{enabled:true, formatter:(val:number)=>`${val} • ${max?Math.round(val/max*100):0}%`},
      grid:{borderColor:'#eee'}
    });
  });

  opportunityChart = computed(() => {
    const p = this.pipelineData();
    const pot = [p.leads*0.1, p.q*0.2, p.quoted*0.4, p.verbal*0.7, p.closed*1.0].map(v => Math.round(v * (this.aov()/1000)));
    return this.tap('opportunityChart()', {
      chart:{ id: this.chartKey(), type:'area', height:260, toolbar:{show:false}},
      series:[{name:'Potential $', data: pot}],
      xaxis:{categories:['Leads','Qualified','Quoted','Verbal','Closed']},
      dataLabels:{enabled:false},
      stroke:{curve:'smooth', width:2},
      grid:{borderColor:'#eee'}
    });
  });

  trendChart = computed(() => {
    const mix = this.profile().mix;
    const base = Math.max(6, Math.round(this.orders() / 2));
    const ds = (m:number) => [base*m*0.9, base*m, base*m*1.05, base*m*1.12, base*m*1.08, base*m*1.15].map(n=>Math.round(n));
    const cats = ({ DTD: ['Mon','Tue','Wed','Thu','Fri','Sat'],
                    WTD: ['W1','W2','W3','W4','W5','W6'],
                    MTD: ['W1','W2','W3','W4','W5','W6'],
                    QTD: ['M1','M2','M3','M4','M5','M6'],
                    YTD: ['Q1','Q2','Q3','Q4','Q5','Q6'] } as Record<TF,string[]>)[this.timeframe()];
    return this.tap('trendChart()', {
      chart:{ id: this.chartKey(), type:'area', height:220, toolbar:{show:false}},
      series:[
        { name:'Golf carts index',  data: ds(mix.carts)  },
        { name:'Sheds index',       data: ds(mix.sheds)  },
        { name:'Playsets index',    data: ds(mix.play)   },
        { name:'Cabins index',      data: ds(mix.cabins) },
      ],
      xaxis:{categories:cats},
      dataLabels:{enabled:false},
      stroke:{curve:'smooth', width:2},
      grid:{borderColor:'#eee'}
    });
  });

  // ===== Tickets =====
  tickets = computed(() => {
    const p = this.profile();
    const volume = Math.max(1, this.orders());
    const r = this.rng('TICKETS');
    const base = (mult:number) => Math.max(0, Math.round(volume * mult * (0.9 + r()*0.3)));
    const svcMult = p.serviceComplexity;
    return this.tap('tickets()', {
      high: base(0.12 * svcMult),
      med:  base(0.28 * svcMult),
      low:  base(0.36 * svcMult),
      slaBreaches: Math.max(0, Math.round(base(0.04) * (0.9 + (svcMult-1))))
    });
  });

  ticketsChart = computed(() => this.tap('ticketsChart()', ({
    chart:{ id: this.chartKey(), type:'donut', height:240, toolbar:{show:false}},
    series:[ this.tickets().high, this.tickets().med, this.tickets().low ],
    labels:['High','Medium','Low'],
    legend:{position:'bottom'}
  })));

  // ===== Best Sellers =====
  bestSellersRich = computed(() => {
    const mix = this.profile().mix;
    const r = this.rng('BEST');
    const mult = 0.85 + r()*0.35;
    const items = [
      { name: 'Evolution D5 Maverick 4', brand:'Evolution', img:'/assets/demo/carts/evolution-d5.jpg',         price:9995,  count:Math.round(12*mult*mix.carts*1.2) },
      { name: 'Evolution Forester 6',    brand:'Evolution', img:'/assets/demo/carts/evolution-forester-6.jpg', price:12995, count:Math.round(10*mult*mix.carts*1.1) },
      { name: 'Denago Rover S',          brand:'Denago',    img:'/assets/demo/carts/denago-rover.jpg',         price:8995,  count:Math.round( 9*mult*mix.carts     ) },
      { name: 'Dash Elite 48V',          brand:'Dash',      img:'/assets/demo/carts/dash-elite.jpg',           price:7995,  count:Math.round( 8*mult*mix.carts     ) },
      { name: '12x16 Barn Shed',         brand:'HOP',       img:'/assets/demo/sheds/12x16-barn.jpg',           price:4899,  count:Math.round( 7*mult*mix.sheds     ) },
      { name: 'Poly Adirondack Chair',   brand:'HOP',       img:'/assets/demo/furniture/adirondack.jpg',       price:299,   count:Math.round(18*mult*mix.parts     ) },
    ];
    items.sort((a,b) => b.count - a.count);
    return this.tap('bestSellersRich()', items);
  });

  topSeller = computed(()=> this.tap('topSeller()', this.bestSellersRich()[0]));

  // ===== Deliveries / Service / Rentals =====
  deliveryCalendar = computed(() => {
    const cap = this.profile().deliveryCapacity;
    const slots = Math.max(1, Math.round(5 * cap));
    const label = (d:string, n:number) => ({
      label: d,
      items: Array.from({length: Math.min(n,3)}, (_,i)=>({
        time: `${9+i}:00a`, truck: ['A','B','C'][i%3], driver: ['Aiden F.','Mike R.','Sara L.'][i%3],
        product: ['Evolution D5','Poly Playset','12x16 Barn Shed','EZGO RXV'][i%4]
      }))
    });
    const cal = [
      label('Mon', slots-2), label('Tue', slots-1), label('Wed', slots),
      label('Thu', slots-1), label('Fri', slots), label('Sat', Math.max(0, slots-3)),
      { label:'Sun', items: [] }
    ];
    return this.tap('deliveryCalendar()', cal);
  });

  service = computed(() => this.tap('service()', {
    open: Math.round(6*this.profile().serviceComplexity),
    progress: Math.round(4*this.profile().serviceComplexity),
    parts: Math.round(2*this.profile().serviceComplexity),
    techs: 3
  }));

  serviceJobs = computed(() => {
    const rows = [
      { id:4312, sev:'High',   status:'In Progress',   title:'Brake adjustment', asset:'EZGO RXV #112',    tech:'D. Carter', eta:'Today 4:30p' },
      { id:4313, sev:'Medium', status:'Waiting Parts', title:'Battery check',    asset:'Club Car 48V #77', tech:'L. Nguyen', eta:'Tomorrow' },
      { id:4314, sev:'Low',    status:'Open',          title:'Detail & prep',    asset:'12x16 Barn Shed',  tech:'K. Patel',  eta:'Fri' },
    ];
    const rank:any = {High:0, Medium:1, Low:2};
    const sorted = rows.sort((a,b)=>rank[a.sev]-rank[b.sev]);
    return this.tap('serviceJobs()', sorted);
  });

  rentals = computed(() => {
    const out = Math.max(1, Math.round(this.orders() * 0.3));
    return this.tap('rentals()', { out, dueToday: Math.max(0, Math.round(out*0.2)), overdue: Math.max(0, Math.round(out*0.08)) });
  });
  rentalsRich = computed(() => this.tap('rentalsRich()', [
    { name:'D5 Maverick 4', brand:'Evolution', img:'/assets/demo/rentals/evolution-d5.jpg', due:'Today 4:00p' },
    { name:'E-Bike City 1', brand:'Denago',    img:'/assets/demo/rentals/denago-city.jpg',   due:'Tomorrow'   },
  ]));

  // ===== Inventory =====
  invScopeTitle = computed(()=> this.tap('invScopeTitle()', `${this.storeName()} Inventory`));
  invRows = computed(() => {
    const pid = this.profileId();
    const mix = this.profile().mix;
    if (pid === 's3'){
      const rows = [
        { category:'Golf Carts',           sub:'Evolution / Denago / Dash', count:42,  lowAt:35 },
        { category:'Parts & Accessories',  sub:'Batteries / Tires',         count:120, lowAt:90 }
      ].map(r=>({...r, low: r.count <= r.lowAt}));
      return this.tap('invRows(s3)', rows);
    }
    const rows = [
      { category:'Sheds & Garages',        sub:'10x12 / 12x16 / 10x20',     count: Math.round(40*mix.sheds + 40),  lowAt: 30 },
      { category:'Playsets & Trampolines', sub:'A3 / B2 / 12ft',            count: Math.round(35*mix.play  + 20),  lowAt: 25 },
      { category:'Golf Carts',             sub:'Evolution / Denago / Dash', count: Math.round(30*mix.carts + 20),  lowAt: 30 },
      { category:'Cabins & Structures',    sub:'12x24 / 14x28',             count: Math.round(20*mix.cabins+ 10),  lowAt: 18 },
      { category:'Parts & Accessories',    sub:'Common SKUs',               count: Math.round(80*mix.parts + 120), lowAt:160 },
    ].map(r=>({...r, low: r.count <= r.lowAt}));
    return this.tap('invRows()', rows);
  });

  // ===== Employee perf (cosmetic) =====
  perf = computed(() => this.tap('perf()', ({
    topSales:'S. Harper', trending:'J. Kim', topSupport:'M. Garcia', topDelivery:'R. Brooks', topTech:'A. Singh'
  })));
  perfReasons = computed(() => this.tap('perfReasons()', ({
    sales:'Highest close rate & AOV this period',
    trending:'Pipeline velocity up 35% with 3 closes',
    support:'Most SLAs met; fastest first response',
    delivery:'Most on-time routes; least re-dispatches',
    tech:'Highest first-fix rate; minimal callbacks'
  })));
  perfWhyStats = computed(() => this.tap('perfWhyStats()', ({
    sales:'Close 41% • AOV +$180 vs prev • 9 closes',
    trending:'Velocity +35% • 3 wins • 0 lost',
    support:'SLA met 98% • FRT 12m • CSAT 4.8',
    delivery:'On-time 97% • Routes 22 • Re-dispatch 0',
    tech:'First-fix 92% • Jobs/day 6.1 • Callbacks 1'
  })));
  perfBars = computed(() => this.tap('perfBars()', ({ sales:92, trending:78, support:88, delivery:85, tech:90 })));
  perfDollars = computed(() => {
    const serviceSavings = 85 * 14;
    const salesLift = Math.max(0, (this.aov() - this.prevAov())) * this.orders();
    return this.tap('perfDollars()', { serviceSavings, salesLift });
  });

  // ===== Link helpers (never return empty id) =====
  private idOrFallback(): string {
    const id = this.storeId() || this.store()?.id || mockStores[0]?.id || '1';
    this.log('idOrFallback', id);
    return id;
  }
  salesLink()      { return this.tap('salesLink()',      ['/location', this.idOrFallback(), 'sales']); }
  inventoryLink()  { return this.tap('inventoryLink()',  ['/location', this.idOrFallback(), 'inventory']); }
  ticketsLink()    { return this.tap('ticketsLink()',    ['/location', this.idOrFallback(), 'tickets']); }
  deliveriesLink() { return this.tap('deliveriesLink()', ['/location', this.idOrFallback(), 'deliveries']); }
  serviceLink()    { return this.tap('serviceLink()',    ['/location', this.idOrFallback(), 'service']); }
  rentalsLink()    { return this.tap('rentalsLink()',    ['/location', this.idOrFallback(), 'rentals']); }
  reportsLink()    { return this.tap('reportsLink()',    ['/portal/reports']); }

  // ===== KPI Sparklines =====
  sparkSales = computed(() => this.tap('sparkSales()', ({
    chart:{ id: this.chartKey(), type:'area', height:40, sparkline:{enabled:true}},
    series:[{ data: this.seriesFromKpi(14) }],
    stroke:{ curve:'smooth', width:2 }, fill:{opacity:0.25}
  })));
  sparkOrders = computed(() => this.tap('sparkOrders()', ({
    chart:{ id: this.chartKey(), type:'area', height:40, sparkline:{enabled:true}},
    series:[{ data: this.seriesRandom(14, this.orders()) }],
    stroke:{curve:'smooth', width:2}, fill:{opacity:0.25}
  })));
  sparkAov = computed(() => this.tap('sparkAov()', ({
    chart:{ id: this.chartKey(), type:'line', height:40, sparkline:{enabled:true}},
    series:[{ data: this.seriesWobble(14, this.aov(), 0.06) }],
    stroke:{curve:'smooth', width:2}
  })));
  sparkRefund = computed(() => this.tap('sparkRefund()', ({
    chart:{ id: this.chartKey(), type:'line', height:40, sparkline:{enabled:true}},
    series:[{ data: this.seriesWobble(14, +this.refundRate(), 0.08) }],
    stroke:{curve:'smooth', width:2}
  })));

  private seriesFromKpi(n=12){
    const total = Math.max(1, this.totalSales());
    const r = this.rng('SPARK');
    const wobble = 0.12;
    const data = Array.from({length:n},(_,i)=> Math.round((total/n)*(0.9 + r()*0.2)*(1 + Math.sin(i/1.7)*wobble)));
    return this.tap('seriesFromKpi()', data);
  }
  private seriesRandom(n:number, base:number){
    const data = Array.from({length:n},(_,i)=> Math.round(base*(0.6 + Math.sin(i/2)*0.15 + (i%3?0.12:0))));
    return this.tap('seriesRandom()', data);
  }
  private seriesWobble(n:number, center:number, wob:number){
    const data = Array.from({length:n},(_,i)=> +(center*(1 + Math.sin(i/2)*wob)).toFixed(2));
    return this.tap('seriesWobble()', data);
  }

  private deltaPct(prev:number, cur:number){ const v = (!prev ? 0 : Math.round(((cur-prev)/prev)*100)); return this.tap('deltaPct()', v); }
  imgFallback(e:Event){ (e.target as HTMLImageElement).style.display='none'; this.log('imgFallback()', 'hide broken image'); }

  // Watch core inputs
  _watch = effect(() => {
    this.log('watch', {
      url: this.router.url,
      storeId: this.storeId(),
      profileId: this.profileId(),
      timeframe: this.timeframe(),
      seedTick: this.seedTick(),
      chartKey: this.chartKey()
    });
  });
}
