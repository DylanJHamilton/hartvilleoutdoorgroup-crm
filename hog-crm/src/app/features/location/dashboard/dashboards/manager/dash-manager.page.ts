import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';

import { HogChartDirective } from '../../../../../shared/ui/chart/hog-chart.directive';
import { StatCardComponent } from '../../../../../shared/ui/stat-card/stat-card.component';
import { ToastService } from '../../../../../shared/ui/toast.service';
import { mockStores, type LocationRef } from '../../../../../mock/locations.mock';

type TF = 'MTD'|'WTD'|'DTD'|'QTD'|'YTD';

@Component({
  standalone: true,
  selector: 'hog-dash-manager',
  imports: [
    CommonModule, RouterLink, NgOptimizedImage,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatChipsModule, MatMenuModule,
    HogChartDirective, StatCardComponent
  ],
  templateUrl: './dash-manager.page.html',
  styleUrls: ['./dash-manager.page.scss']
})
export class DashManagerPage {
  // ===== Context =====
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  storeId   = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  store     = computed<LocationRef|undefined>(() => mockStores.find(s => s.id === this.storeId()));
  storeName = computed(() => this.store()?.name ?? `Store ${this.storeId()}`);

  // ===== Filters =====
  timeframe = signal<TF>('MTD');
  onTimeframe(tf: TF){ this.timeframe.set(tf); }
  q = signal('');

  // ===== Seed helpers =====
  private seedTick = signal(0);
  refresh(){ this.seedTick.update(v=>v+1); this.toast.success('Manager data refreshed'); }

  private hash(s:string){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h+= (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);} return (h>>>0)/4294967295; }
  private seeded(mult=1, wobble=0){
    const key = `${this.storeId()}|${this.timeframe()}|${this.seedTick()}`;
    const base = this.hash(key);
    return Math.max(0, (base*mult) + Math.sin(base*9.9)*wobble);
  }
  private tfAxis(): string[] {
    switch(this.timeframe()){
      case 'DTD': return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      case 'WTD': return ['W1','W2','W3','W4'];
      case 'QTD': return ['M1','M2','M3','M4'];
      case 'YTD': return ['Q1','Q2','Q3','Q4','Q5','Q6'];
      case 'MTD':
      default:    return ['W1','W2','W3','W4','W5'];
    }
  }

  // ===== KPI baselines (store-scoped) =====
  private KPI_STORE: Record<TF, any> = {
    DTD: { total: 2100, prev: 1800, aov: 3900, aovPrev: 3750, orders:  3, ordersPrev: 2, refund: 1.2 },
    WTD: { total: 9800, prev:  8600, aov: 3880, aovPrev: 3720, orders:  3, ordersPrev: 2, refund: 1.3 },
    MTD: { total: 56800, prev: 51200, aov: 3860, aovPrev: 3700, orders: 13, ordersPrev:11, refund: 1.5 },
    QTD: { total:154600, prev:141900, aov: 3840, aovPrev: 3690, orders: 41, ordersPrev:36, refund: 1.5 },
    YTD: { total:303400, prev:285900, aov: 3820, aovPrev: 3680, orders: 79, ordersPrev:73, refund: 1.6 },
  };

  // KPI signals
  totalSales      = computed(() => this.KPI_STORE[this.timeframe()].total);
  prevTotalSales  = computed(() => this.KPI_STORE[this.timeframe()].prev);
  aov             = computed(() => this.KPI_STORE[this.timeframe()].aov);
  prevAov         = computed(() => this.KPI_STORE[this.timeframe()].aovPrev);
  orders          = computed(() => this.KPI_STORE[this.timeframe()].orders);
  prevOrders      = computed(() => this.KPI_STORE[this.timeframe()].ordersPrev);
  refundRate      = computed(() => this.KPI_STORE[this.timeframe()].refund);

  // String values for stat cards
  totalSalesStr = computed(() => (this.totalSales()).toLocaleString('en-US',{style:'currency',currency:'USD'}));
  aovStr        = computed(() => (this.aov()).toLocaleString('en-US',{style:'currency',currency:'USD'}));
  ordersStr     = computed(() => `${this.orders()}`);
  refundStr     = computed(() => `${this.refundRate().toFixed(1)}%`);

  // Deltas
  private pct(prev:number, cur:number){ if(!prev) return 0; return Math.round(((cur - prev)/prev)*100); }
  salesDelta = computed(() => this.pct(this.prevTotalSales(), this.totalSales()));
  ordersDelta = computed(() => this.pct(this.prevOrders(), this.orders()));

  // ===== Pipeline (store scope) =====
  private pipelineData = computed(() => {
    const base = { leads: 120, q: 82, quoted: 56, verbal: 31, closed: 18 };
    const tf = this.timeframe();
    const scale = ({ DTD: 0.18, WTD: 0.45, MTD: 1.0, QTD: 2.2, YTD: 3.9 } as Record<TF, number>)[tf];
    const r = (n:number) => Math.max(1, Math.round(n * scale));
    return { leads:r(base.leads), q:r(base.q), quoted:r(base.quoted), verbal:r(base.verbal), closed:r(base.closed) };
  });

  // ===== Tickets & Ops =====
  tickets = computed(() => {
    const tf = this.timeframe();
    const mul  = ({ DTD: 0.9, WTD: 1.0, MTD: 1.3, QTD: 2.4, YTD: 4.2 } as Record<TF, number>)[tf];
    const base = { high: 3, med: 9, low: 12, sla: 1 };
    const r = (n:number) => Math.max(0, Math.round(n*mul));
    return { high: r(base.high), med: r(base.med), low: r(base.low), slaBreaches: r(base.sla) };
  });

  // ===== Inventory health (store view) =====
  invRows = computed(() => [
    { category: 'Sheds & Garages',        sub: '10x12 / 12x16 / 10x20', count: 68,  lowAt: 30 },
    { category: 'Playsets & Trampolines', sub: 'A3 / B2 / 12ft',        count: 54,  lowAt: 25 },
    { category: 'Golf Carts',             sub: 'Evolution / Denago',    count: 35,  lowAt: 30 },
    { category: 'Cabins & Structures',    sub: '12x24 / 14x28',         count: 22,  lowAt: 18 },
    { category: 'Parts & Accessories',    sub: 'Common SKUs',           count: 210, lowAt: 160 },
  ].map(r => ({ ...r, low: r.count <= r.lowAt })));

  // ===== Team / Staff (demo) =====
  staff = [
    { name:'S. Harper', role:'Sales',   kpi:'Close 41%',  aov:'+ $180',  jobs:9 },
    { name:'J. Kim',    role:'Sales',   kpi:'Velocity +35%', aov:'+ $90', jobs:6 },
    { name:'M. Garcia', role:'Support', kpi:'SLA 98%',    aov:'',        jobs:34 },
    { name:'A. Singh',  role:'Service', kpi:'First-fix 92%', aov:'',     jobs:29 },
    { name:'R. Brooks', role:'Delivery',kpi:'On-time 97%', aov:'',       jobs:22 },
  ];

  // ===== Charts =====
  salesChart = computed(() => {
    const axis = this.tfAxis();
    const n = axis.length;
    const total = this.totalSales();
    const base = total / n;
    const wobble = { DTD:0.16, WTD:0.14, MTD:0.12, QTD:0.10, YTD:0.08 }[this.timeframe()];
    const data:number[] = [];
    for(let i=0;i<n;i++) data.push(Math.round(base * (1 + Math.sin(i/1.7) * wobble)));
    return {
      chart:{ type:'line', height:260, toolbar:{show:false} },
      series:[{ name:'Sales', data }],
      xaxis:{ categories: axis },
      dataLabels:{ enabled:false }, stroke:{ curve:'smooth', width:3 }, grid:{ borderColor:'#eee' }
    };
  });

  pipelineChart = computed(() => {
    const p = this.pipelineData();
    const seriesData = [
      { x:'Leads', y:p.leads }, { x:'Qualified', y:p.q },
      { x:'Quoted', y:p.quoted }, { x:'Verbal Yes', y:p.verbal }, { x:'Closed', y:p.closed }
    ];
    const max = Math.max(...seriesData.map(d=>d.y));
    return {
      chart:{ type:'bar', height:260, toolbar:{show:false} },
      plotOptions:{ bar:{ horizontal:true, distributed:true, borderRadius:4 } },
      series:[{ data: seriesData }],
      dataLabels:{ enabled:true, formatter:(val:number)=> `${val} • ${max?Math.round(val/max*100):0}%` },
      grid:{ borderColor:'#eee' }
    };
  });

  opportunityChart = computed(() => {
    const p = this.pipelineData();
    const pot = [p.leads*0.1, p.q*0.2, p.quoted*0.4, p.verbal*0.7, p.closed*1.0].map(v => Math.round(v * (this.aov()/1000)));
    return {
      chart:{ type:'area', height:260, toolbar:{show:false} },
      series:[{ name:'Potential $', data: pot }],
      xaxis:{ categories:['Leads','Qualified','Quoted','Verbal','Closed'] },
      dataLabels:{ enabled:false }, stroke:{ curve:'smooth', width:2 }, grid:{ borderColor:'#eee' }
    };
  });

  trendChart = computed(() => {
    const cats = this.tfAxis();
    const sheds   = [15,18,20,19,22,24].slice(0, Math.min(6,cats.length));
    const carts   = [12,14,16,18,21,24].slice(0, Math.min(6,cats.length));
    const play    = [9,10,10,12,13,14].slice(0, Math.min(6,cats.length));
    const cabins  = [4,5,6,6,7,7].slice(0, Math.min(6,cats.length));
    return {
      chart:{ type:'area', height:220, toolbar:{show:false} },
      series:[
        { name:'Sheds index', data:sheds },
        { name:'Golf carts index', data:carts },
        { name:'Playsets index', data:play },
        { name:'Cabins index', data:cabins },
      ],
      xaxis:{ categories: cats.slice(0, Math.min(cats.length, 6)) },
      dataLabels:{ enabled:false }, stroke:{ curve:'smooth', width:2 }, grid:{ borderColor:'#eee' }
    };
  });

  ticketsChart = computed(() => {
    const t = this.tickets();
    return {
      chart:{ type:'donut', height:240, toolbar:{show:false} },
      series:[t.high, t.med, t.low], labels:['High','Medium','Low'], legend:{ position:'bottom' }
    };
  });

  // ===== Links (stubs) =====
  openSales(){ this.toast.info('Open Sales…'); }
  openPipeline(){ this.toast.info('Open Pipeline…'); }
  openTickets(){ this.toast.info('Open Tickets…'); }
  openInventory(){ this.toast.info('Open Inventory…'); }
  openService(){ this.toast.info('Open Service…'); }
  openDeliveries(){ this.toast.info('Open Deliveries…'); }
  openReports(){ this.toast.info('Open Reports…'); }
}
