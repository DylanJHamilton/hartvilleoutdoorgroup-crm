import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

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

type TF = 'MTD'|'WTD'|'DTD'|'YTD'|'QTD';

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
  private toast = inject(ToastService);

  // ===== Store context =====
  storeId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  store   = computed<LocationRef|undefined>(() => mockStores.find(s => s.id === this.storeId()));
  storeName = computed(() => this.store()?.name ?? `Store ${this.storeId()}`);

  // ===== Timeframe filter (match Portal) =====
  timeframe = signal<TF>('MTD');
  onTimeframe(tf: TF) { this.timeframe.set(tf); }
  timeframeLabel = computed(() => ({MTD:'month',WTD:'week',DTD:'day',YTD:'year',QTD:'quarter'} as const)[this.timeframe()]);

  // ===== Deterministic per-store seeding =====
  private seedTick = signal(0);
  refresh(){ this.seedTick.update(v=>v+1); this.toast.success('Data refreshed'); }

  private hash(s:string){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h+= (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);} return (h>>>0)/4294967295; }
  private seeded(mult=1, wobble=0){
    const key = `${this.storeId()}|${this.timeframe()}|${this.seedTick()}`;
    const base = this.hash(key);
    return Math.max(0, (base * mult) + Math.sin(base*12.3)*wobble);
  }
  private tfScale(): number {
    return ({DTD:0.12,WTD:0.35,MTD:1,QTD:2.0,YTD:3.6} as Record<TF,number>)[this.timeframe()];
  }

  // ===== KPIs (per-store) =====
  private kpiBlock = computed(()=>{
    const scale = this.tfScale();
    const flavor = this.seeded(1,0.03);         // 0..~1
    const sizeBias = 0.75 + flavor*0.8;         // 0.75..1.55
    const total = Math.round(182400 * scale * sizeBias);
    const prev  = Math.round(total * (0.88 + this.seeded(0.12)*0.12));
    const orders = Math.max(1, Math.round((43*scale) * (0.7 + this.seeded(0.3))));
    const aov = Math.round(total / Math.max(orders,1));
    const aovPrev = Math.max(800, Math.round(aov*(0.94 + this.seeded(0.06)*0.06)));
    const refund = +(1.0 + this.seeded(1)*1.2).toFixed(1);
    return { total, prev, orders, ordersPrev: Math.max(1, Math.round(orders*(0.85 + this.seeded(0.2)*0.2))), aov, aovPrev, refund };
  });

  totalSales     = computed(()=> this.kpiBlock().total);
  prevTotalSales = computed(()=> this.kpiBlock().prev);
  salesDelta     = computed(()=> this.deltaPct(this.prevTotalSales(), this.totalSales()));
  orders         = computed(()=> this.kpiBlock().orders);
  prevOrders     = computed(()=> this.kpiBlock().ordersPrev);
  ordersDelta    = computed(()=> this.deltaPct(this.prevOrders(), this.orders()));
  aov            = computed(()=> this.kpiBlock().aov);
  prevAov        = computed(()=> this.kpiBlock().aovPrev);
  refundRate     = computed(()=> this.kpiBlock().refund.toFixed(1));  // string

  // ===== Charts & series (per-store flavored) =====
  private axisFromTF(): string[] {
    switch (this.timeframe()) {
      case 'DTD': return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      case 'WTD': return ['Week 1','Week 2','Week 3','Week 4'];
      case 'QTD': return ['Month 1','Month 2','Month 3','Month 4'];
      case 'YTD': return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      case 'MTD': default: return ['W1','W2','W3','W4','W5'];
    }
  }
  private buildSalesSeries(): number[] {
    const axis = this.axisFromTF();
    const n = axis.length;
    const total = this.totalSales();
    const base = total / n;
    const wobble = ({DTD:0.18,WTD:0.15,MTD:0.12,QTD:0.10,YTD:0.08} as Record<TF,number>)[this.timeframe()];
    const shift = this.seeded(4)*4;
    const out:number[] = [];
    for(let i=0;i<n;i++){
      const v = base * (1 + Math.sin((i+shift)/1.7)*wobble);
      out.push(Math.max(1, Math.round(v)));
    }
    return out;
  }

  salesChart = computed(()=>({
    chart: { type:'line', height:260, toolbar:{show:false}},
    series: [{ name: 'Sales', data: this.buildSalesSeries() }],
    xaxis: { categories: this.axisFromTF() },
    dataLabels:{enabled:false},
    stroke:{curve:'smooth', width:3},
    grid:{borderColor:'#eee'}
  }));

  private pipelineData = computed(()=>{
    const scale = this.tfScale();
    const base = { leads: 120, q: 82, quoted: 55, verbal: 30, closed: 18 };
    const wob  = 0.85 + this.seeded(0.3)*0.3;
    const r = (n:number)=> Math.max(1, Math.round(n*scale*wob));
    return { leads:r(base.leads), q:r(base.q), quoted:r(base.quoted), verbal:r(base.verbal), closed:r(base.closed) };
  });

  pipelineChart = computed(()=>{
    const p = this.pipelineData();
    const seriesData = [
      {x:'Leads', y:p.leads}, {x:'Qualified', y:p.q},
      {x:'Quoted', y:p.quoted}, {x:'Verbal Yes', y:p.verbal}, {x:'Closed', y:p.closed},
    ];
    const max = seriesData.reduce((m,d)=>Math.max(m,d.y),0);
    return {
      chart:{type:'bar', height:260, toolbar:{show:false}},
      plotOptions:{bar:{horizontal:true, distributed:true, borderRadius:4}},
      series:[{data:seriesData}],
      dataLabels:{enabled:true, formatter:(val:number)=>`${val} • ${max?Math.round(val/max*100):0}%`},
      grid:{borderColor:'#eee'}
    };
  });

  opportunityChart = computed(()=>{
    const p = this.pipelineData();
    const pot = [p.leads*0.1, p.q*0.2, p.quoted*0.4, p.verbal*0.7, p.closed*1.0].map(v => Math.round(v * (this.aov()/1000)));
    return {
      chart:{type:'area', height:260, toolbar:{show:false}},
      series:[{name:'Potential $', data: pot}],
      xaxis:{categories:['Leads','Qualified','Quoted','Verbal','Closed']},
      dataLabels:{enabled:false},
      stroke:{curve:'smooth', width:2},
      grid:{borderColor:'#eee'}
    };
  });

  trendChart = computed(()=>{
    // per-store mix (carts vs sheds vs play vs cabins)
    const bias = this.seeded(1);
    const mk = (base:number)=>[
      Math.round(base*(0.8+ bias*0.15)),
      Math.round(base*(0.9+ bias*0.10)),
      Math.round(base*(1.0+ bias*0.08)),
      Math.round(base*(0.95+ bias*0.12)),
      Math.round(base*(1.05+ bias*0.10)),
      Math.round(base*(1.1+ bias*0.06)),
    ];
    const sheds  = mk(22);
    const carts  = mk(24 + Math.round(bias*12));
    const play   = mk(12 + Math.round((1-bias)*8));
    const cabins = mk(7  + Math.round((1-bias)*5));
    const cats = ({DTD:['Mon','Tue','Wed','Thu','Fri','Sat'],
                   WTD:['W1','W2','W3','W4','W5','W6'],
                   MTD:['W1','W2','W3','W4','W5','W6'],
                   QTD:['M1','M2','M3','M4','M5','M6'],
                   YTD:['Q1','Q2','Q3','Q4','Q5','Q6']} as Record<TF,string[]>)[this.timeframe()];
    return {
      chart:{type:'area', height:220, toolbar:{show:false}},
      series:[
        {name:'Sheds index', data:sheds},
        {name:'Golf carts index', data:carts},
        {name:'Playsets index', data:play},
        {name:'Cabins index', data:cabins},
      ],
      xaxis:{categories:cats},
      dataLabels:{enabled:false},
      stroke:{curve:'smooth', width:2},
      grid:{borderColor:'#eee'}
    };
  });

  tickets = computed(()=>{
    const mul = ({DTD:0.8,WTD:1,MTD:1.4,QTD:2.6,YTD:4.5} as Record<TF,number>)[this.timeframe()];
    const r = (n:number)=> Math.max(0, Math.round(n*mul*(0.85 + this.seeded(0.3)*0.3)));
    return { high:r(3), med:r(9), low:r(12), slaBreaches:r(1) };
  });

  ticketsChart = computed(()=>({
    chart:{type:'donut', height:240, toolbar:{show:false}},
    series:[ this.tickets().high, this.tickets().med, this.tickets().low ],
    labels:['High','Medium','Low'],
    legend:{position:'bottom'}
  }));

  // ===== Best sellers / top seller cards =====
  bestSellersRich = computed(()=>{
    const mult = 0.6 + this.seeded(0.5); // 0.6..1.1
    return [
      { name: 'Evolution D5 Maverick 4', brand:'Evolution', img:'/assets/demo/carts/evolution-d5.jpg',         price:9995,  count:Math.round(12*mult) },
      { name: 'Evolution Forester 6',    brand:'Evolution', img:'/assets/demo/carts/evolution-forester-6.jpg', price:12995, count:Math.round(10*mult) },
      { name: 'Denago Rover S',          brand:'Denago',    img:'/assets/demo/carts/denago-rover.jpg',         price:8995,  count:Math.round(9*mult)  },
      { name: 'Dash Elite 48V',          brand:'Dash',      img:'/assets/demo/carts/dash-elite.jpg',           price:7995,  count:Math.round(8*mult)  },
      { name: '12x16 Barn Shed',         brand:'HOP',       img:'/assets/demo/sheds/12x16-barn.jpg',           price:4899,  count:Math.round(7*mult)  },
      { name: 'Poly Adirondack Chair',   brand:'HOP',       img:'/assets/demo/furniture/adirondack.jpg',       price:299,   count:Math.round(18*mult) },
    ];
  });
  topSeller = computed(()=> this.bestSellersRich()[0]);

  // ===== Deliveries (Mon–Sun) =====
  deliveryCalendar = computed(()=>{
    const co = false; // location scope
    const items = (label:string, entries:any[]) => ({label, items:entries});
    return [
      items('Mon', [{ time:'9:00a', truck:'A', driver:'Aiden F.',  product: co?'12x16 Barn Shed':'Evolution D5' }]),
      items('Tue', [{ time:'10:00a',truck:'B', driver:'Mike R.',   product:'Dash Elite 48V' }]),
      items('Wed', [{ time:'1:30p', truck:'C', driver:'Sara L.',   product:'Club Car 48V (refurb)' }]),
      items('Thu', [{ time:'11:00a',truck:'A', driver:'Team',      product:'EZGO RXV' }]),
      items('Fri', [{ time:'2:00p', truck:'B', driver:'Dispatch',  product:'12x20 Garage' }]),
      items('Sat', [{ time:'9:00a', truck:'A', driver:'Aiden F.',  product:'Evolution Forester 6' }]),
      items('Sun', []),
    ];
  });

  // ===== Service overview =====
  service = computed(()=> ({ open:6, progress:4, parts:2, techs:3 }));
  serviceJobs = computed(()=>{
    const rows = [
      { id:4312, sev:'High',   status:'In Progress',   title:'Brake adjustment', asset:'EZGO RXV #112',    tech:'D. Carter', eta:'Today 4:30p' },
      { id:4313, sev:'Medium', status:'Waiting Parts', title:'Battery check',    asset:'Club Car 48V #77', tech:'L. Nguyen', eta:'Tomorrow' },
      { id:4314, sev:'Low',    status:'Open',          title:'Detail & prep',    asset:'12x16 Barn Shed',  tech:'K. Patel',  eta:'Fri' },
    ];
    const rank:any = {High:0, Medium:1, Low:2};
    return rows.sort((a,b)=>rank[a.sev]-rank[b.sev]);
  });

  // ===== Rentals =====
  rentals = computed(()=> ({ out:4, dueToday:1, overdue:0 }));
  rentalsRich = computed(()=>[
    { name:'D5 Maverick 4', brand:'Evolution', img:'/assets/demo/rentals/evolution-d5.jpg', due:'Today 4:00p' },
    { name:'E-Bike City 1', brand:'Denago',    img:'/assets/demo/rentals/denago-city.jpg',   due:'Tomorrow'   },
  ]);

  // ===== Inventory table =====
  invScopeTitle = computed(()=> `${this.storeName()} Inventory`);
  invRows = computed(()=>{
    // Example: Mentor '3' cart-heavy, others broader
    if (this.storeId()==='3'){
      return [
        { category:'Golf Carts',           sub:'Evolution / Denago / Dash', count:42,  lowAt:35 },
        { category:'Parts & Accessories',  sub:'Batteries / Tires',         count:120, lowAt:90 }
      ].map(r=>({...r, low: r.count <= r.lowAt}));
    }
    return [
      { category:'Sheds & Garages',        sub:'10x12 / 12x16 / 10x20',     count:68,  lowAt:30 },
      { category:'Playsets & Trampolines', sub:'A3 / B2 / 12ft',            count:54,  lowAt:25 },
      { category:'Golf Carts',             sub:'Evolution / Denago / Dash', count:35,  lowAt:30 },
      { category:'Cabins & Structures',    sub:'12x24 / 14x28',             count:22,  lowAt:18 },
      { category:'Parts & Accessories',    sub:'Common SKUs',               count:210, lowAt:160 },
    ].map(r=>({...r, low: r.count <= r.lowAt}));
  });

  // ===== Employee performance =====
  perf = computed(()=>({
    topSales:'S. Harper', trending:'J. Kim', topSupport:'M. Garcia', topDelivery:'R. Brooks', topTech:'A. Singh'
  }));
  perfReasons = computed(()=>({
    sales:'Highest close rate & AOV this period',
    trending:'Pipeline velocity up 35% with 3 closes',
    support:'Most SLAs met; fastest first response',
    delivery:'Most on-time routes; least re-dispatches',
    tech:'Highest first-fix rate; minimal callbacks'
  }));
  perfWhyStats = computed(()=>({
    sales:'Close 41% • AOV +$180 vs prev • 9 closes',
    trending:'Velocity +35% • 3 wins • 0 lost',
    support:'SLA met 98% • FRT 12m • CSAT 4.8',
    delivery:'On-time 97% • Routes 22 • Re-dispatch 0',
    tech:'First-fix 92% • Jobs/day 6.1 • Callbacks 1'
  }));
  perfBars = computed(()=>({ sales:92, trending:78, support:88, delivery:85, tech:90 }));
  perfDollars = computed(()=>{
    const svcHoursSaved = 14;               // store scope
    const serviceSavings = svcHoursSaved * 85;
    const salesLift = Math.max(0, (this.aov() - this.prevAov())) * this.orders();
    return { serviceSavings, salesLift };
  });

  // ===== Links (location-scoped deep-links) =====
  salesLink()      { return ['/location', this.storeId(), 'sales']; }
  inventoryLink()  { return ['/location', this.storeId(), 'inventory']; }
  ticketsLink()    { return ['/location', this.storeId(), 'tickets']; }
  deliveriesLink() { return ['/location', this.storeId(), 'deliveries']; }
  serviceLink()    { return ['/location', this.storeId(), 'service']; }
  rentalsLink()    { return ['/location', this.storeId(), 'rentals']; }
  reportsLink()    { return ['/portal/reports']; }

  // ===== helpers =====
  private deltaPct(prev:number, cur:number){ if(!prev) return 0; return Math.round(((cur-prev)/prev)*100); }
  imgFallback(e:Event){ (e.target as HTMLImageElement).style.display='none'; }
}
