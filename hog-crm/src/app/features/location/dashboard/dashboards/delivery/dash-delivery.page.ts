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
type DStatus = 'Queued'|'En-route'|'Delivered'|'Exception'|'Cancelled';
type VType = 'Truck'|'Trailer'|'Van';

interface RouteStop {
  id: number;
  day: string;     // e.g., 'Mon'
  time: string;    // '9:15a'
  driver: string;
  vehicle: VType;
  status: DStatus;
  customer: string;
  product: string;
  miles: number;
  window: string;  // '9–11a'
}

@Component({
  standalone: true,
  selector: 'hog-dash-delivery',
  imports: [
    CommonModule, RouterLink, NgOptimizedImage,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatChipsModule, MatMenuModule,
    HogChartDirective, StatCardComponent
  ],
  templateUrl: './dash-delivery.page.html',
  styleUrls: ['./dash-delivery.page.scss']
})
export class DashDeliveryPage {
  // ===== Context =====
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  storeId   = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  store     = computed<LocationRef|undefined>(() => mockStores.find(s => s.id === this.storeId()));
  storeName = computed(() => this.store()?.name ?? `Store ${this.storeId()}`);

  // ===== Filters =====
  timeframe = signal<TF>('MTD');
  onTimeframe(tf: TF){ this.timeframe.set(tf); }

  status = signal<DStatus | 'All'>('All');
  vehicle = signal<VType | 'All'>('All');
  driver  = signal<string | 'All'>('All');
  q       = signal('');

  // ===== Utilities =====
  private seedTick = signal(0);
  refresh(){ this.seedTick.update(v=>v+1); this.toast.success('Delivery data refreshed'); }

  private hash(s:string){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h+= (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);} return (h>>>0)/4294967295; }
  private seeded(mult=1, wobble=0){
    const key = `${this.storeId()}|${this.timeframe()}|${this.seedTick()}`;
    const base = this.hash(key);
    return Math.max(0, (base*mult) + Math.sin(base*9.7)*wobble);
  }
  private tfScale(): number {
    return ({DTD:0.25,WTD:0.55,MTD:1,QTD:2.1,YTD:3.9} as Record<TF,number>)[this.timeframe()];
  }

  // ===== Demo Data =====
  private driversList = ['Aiden F.','Mike R.','Sara L.','Chris P.','Dana K.','Leo M.'];
  private vehiclesList: VType[] = ['Truck','Trailer','Van'];
  private days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  private products = [
    '12x16 Barn Shed','Poly Playset A3','Evolution D5','EZGO RXV',
    'Club Car 48V (refurb)','12x20 Garage','Poly Adirondack'
  ];
  private customers = ['M. Jones','R. Chen','A. Gray','T. Brown','S. Patel','J. Rivera','L. Flores'];

  private buildStops(): RouteStop[] {
    const base = Math.max(32, Math.round(44 * this.tfScale() * (0.85 + this.seeded(0.8))));
    const out: RouteStop[] = [];
    for (let i=0; i<base; i++){
      const d  = this.days[i % 7];
      const hr = 8 + (i % 8); // 8a..3p
      const min = (i % 2) ? '30' : '00';
      const time = `${(hr>12?hr-12:hr)}:${min}${hr>=12?'p':'a'}`;
      const drv = this.driversList[i % this.driversList.length];
      const veh = this.vehiclesList[i % this.vehiclesList.length];
      const st: DStatus = (i % 9 === 0) ? 'Queued' : (i % 7 === 0) ? 'Exception' : (i % 3 === 0) ? 'En-route' : (i % 5 === 0) ? 'Cancelled' : 'Delivered';
      const miles = Math.round(6 + this.seeded(8, 3) + (i % 6));
      const winStart = hr;
      const window = `${(winStart>12?winStart-12:winStart)}–${(winStart+2>12?winStart-10:winStart+2)}${winStart>=10?'p':'a'}`;
      out.push({
        id: 9000+i,
        day: d,
        time, driver: drv, vehicle: veh, status: st,
        customer: this.customers[(i*3)%this.customers.length],
        product: this.products[(i*2)%this.products.length],
        miles, window
      });
    }
    // Ensure there are some En-route
    if (!out.some(s => s.status === 'En-route')) {
      out[0].status = 'En-route';
      out[1].status = 'En-route';
    }
    return out;
  }

  private allStops = signal<RouteStop[]>([]);
  constructor(){ this.allStops.set(this.buildStops()); }
  private _ = computed(()=>{ this.timeframe(); this.seedTick(); this.storeId(); this.allStops.set(this.buildStops()); return true; });

  // Derived / filters
  driverOptions = computed(() => ['All', ...this.driversList]);
  stops = computed(() => {
    const q = this.q().toLowerCase();
    const s = this.status(); const v = this.vehicle(); const d = this.driver();
    return this.allStops().filter(r =>
      (s==='All' || r.status===s) &&
      (v==='All' || r.vehicle===v) &&
      (d==='All' || r.driver===d) &&
      (!q || r.customer.toLowerCase().includes(q) || r.product.toLowerCase().includes(q) || (''+r.id).includes(q))
    );
  });

  // KPIs (strings for StatCard)
  inTransitCount  = computed(() => this.allStops().filter(s => s.status==='En-route').length);
  queuedCount     = computed(() => this.allStops().filter(s => s.status==='Queued').length);
  deliveredCount  = computed(() => this.allStops().filter(s => s.status==='Delivered').length);
  exceptionsCount = computed (() => this.allStops().filter(s => s.status==='Exception').length);

  onTimePct       = computed(() => Math.min(100, Math.round(93 + this.seeded(6, 2))));
  avgRouteMiles   = computed(() => Math.max(10, Math.round(24 + this.seeded(10, 4))));
  dropsToday      = computed(() => Math.max(6, Math.round(10 + this.seeded(6, 3))));

  inTransitStr  = computed(() => `${this.inTransitCount()}`);
  deliveredStr  = computed(() => `${this.deliveredCount()}`);
  onTimeStr     = computed(() => `${this.onTimePct()}%`);
  avgMilesStr   = computed(() => `${this.avgRouteMiles()}`);
  queuedStr     = computed(() => `${this.queuedCount()}`);
  exceptionsStr = computed(() => `${this.exceptionsCount()}`);
  dropsTodayStr = computed(() => `${this.dropsToday()}`);

  // Charts
  dropsTrendChart = computed(() => {
    const base = Math.max(10, Math.round(14 * (0.8 + this.seeded(0.6))));
    const data = Array.from({length:14}).map((_,i)=> Math.max(6, Math.round(base + Math.sin(i/1.8)*3 + this.seeded(2))));
    return {
      chart:{ type:'line', height:260, toolbar:{show:false} },
      series:[{ name:'Deliveries', data }],
      xaxis:{ categories:['M1','T1','W1','T1','F1','S1','S1','M2','T2','W2','T2','F2','S2','S2'] },
      dataLabels:{ enabled:false }, stroke:{ curve:'smooth', width:3 }, grid:{ borderColor:'#eee' }
    };
  });

  onTimeTrendChart = computed(() => {
    const base = this.onTimePct();
    const data = Array.from({length:8}).map((_,i)=> Math.min(100, Math.max(85, Math.round(base + Math.cos(i/1.7)*2 + this.seeded(1)))));
    return {
      chart:{ type:'line', height:220, toolbar:{show:false} },
      series:[{ name:'On-Time %', data }],
      xaxis:{ categories:['P1','P2','P3','P4','P5','P6','P7','P8'] },
      dataLabels:{ enabled:false }, stroke:{ curve:'smooth', width:3 }, grid:{ borderColor:'#eee' }
    };
  });

  vehicleMixChart = computed(() => {
    const t = this.stops().filter(s=>s.vehicle==='Truck').length;
    const tr = this.stops().filter(s=>s.vehicle==='Trailer').length;
    const v = this.stops().filter(s=>s.vehicle==='Van').length;
    return { chart:{ type:'donut', height:240, toolbar:{show:false} }, series:[t,tr,v], labels:['Truck','Trailer','Van'], legend:{position:'bottom'} };
  });

  statusMixChart = computed(() => {
    const q = this.stops().filter(s=>s.status==='Queued').length;
    const e = this.stops().filter(s=>s.status==='En-route').length;
    const d = this.stops().filter(s=>s.status==='Delivered').length;
    const x = this.stops().filter(s=>s.status==='Exception').length;
    return {
      chart:{ type:'donut', height:240, toolbar:{show:false} },
      series:[q,e,d,x], labels:['Queued','En-route','Delivered','Exception'], legend:{position:'bottom'}
    };
  });

  driverLoadChart = computed(() => ({
    chart:{ type:'bar', height:220, toolbar:{show:false} },
    plotOptions:{ bar:{ horizontal:true, borderRadius:4 } },
    series:[{
      name:'Active',
      data: this.driversList.map(dr => ({
        x: dr,
        y: this.stops().filter(s => s.driver===dr && (s.status==='Queued' || s.status==='En-route')).length
      }))
    }],
    dataLabels:{ enabled:true }, grid:{ borderColor:'#eee' }
  }));

  // Schedule
  scheduleWeek = computed(() => {
    const items = (label:string, entries:any[]) => ({ label, items: entries });
    return this.days.map(d => items(d,
      this.stops().filter(s => s.day===d).slice(0, 6).map(s => ({
        time: s.time, driver: s.driver, vehicle: s.vehicle, product: s.product
      }))
    ));
  });

  // Actions (stubs)
  startRoute(s: RouteStop){ this.toast.success(`Start delivery #${s.id}`); }
  endRoute(s: RouteStop){ this.toast.success(`End delivery #${s.id}`); }
  reassign(s: RouteStop){ this.toast.info(`Reassign #${s.id}`); }
  addNote(s: RouteStop){ this.toast.info(`Added note to #${s.id}`); }
  exportCsv(){
    const cols = [
      {key:'id', label:'ID', visible:true},
      {key:'day', label:'Day', visible:true},
      {key:'time', label:'Time', visible:true},
      {key:'driver', label:'Driver', visible:true},
      {key:'vehicle', label:'Vehicle', visible:true},
      {key:'status', label:'Status', visible:true},
      {key:'customer', label:'Customer', visible:true},
      {key:'product', label:'Product', visible:true},
      {key:'miles', label:'Miles', visible:true},
      {key:'window', label:'Window', visible:true},
    ];
    const esc = (v:any)=> { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
    const head = cols.filter(c=>c.visible).map(c=>c.label).join(',');
    const body = this.stops().map(r => cols.filter(c=>c.visible).map(c=>esc((r as any)[c.key])).join(',')).join('\n');
    const csv = `${head}\n${body}`;
    this.toast.info(`CSV ready (${this.stops().length} rows)`); console.debug(csv);
  }

  openSchedule(){ this.toast.info('Opening Delivery Schedule…'); }
  openReports(){ this.toast.info('Opening Delivery Reports…'); }
}
