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
type Sev = 'High'|'Medium'|'Low';
type St  = 'Open'|'In Progress'|'Waiting Parts'|'Scheduled'|'Done'|'Cancelled';

interface WorkOrder {
  id: number;
  title: string;
  asset: string;        // cart/shed/etc
  severity: Sev;
  status: St;
  tech: string;
  eta: string;          // e.g., “Today 3:30p”
  openedAgo: string;    // e.g., “6h ago”
  customer: string;
}

interface PartUsage {
  sku: string;
  desc: string;
  qty: number;
  woId: number;
}

@Component({
  standalone: true,
  selector: 'hog-dash-service',
  imports: [
    CommonModule, RouterLink, NgOptimizedImage,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatChipsModule, MatMenuModule,
    HogChartDirective, StatCardComponent
  ],
  templateUrl: './dash-service.page.html',
  styleUrls: ['./dash-service.page.scss']
})
export class DashServicePage {
  // ===== Context =====
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  storeId   = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  store     = computed<LocationRef|undefined>(() => mockStores.find(s => s.id === this.storeId()));
  storeName = computed(() => this.store()?.name ?? `Store ${this.storeId()}`);

  // ===== Filters =====
  timeframe = signal<TF>('MTD');
  onTimeframe(tf: TF){ this.timeframe.set(tf); }

  status = signal<St|'All'>('All');
  sev    = signal<Sev|'All'>('All');
  tech   = signal<string|'All'>('All');
  q      = signal<string>('');

  // ===== Utilities =====
  private seedTick = signal(0);
  refresh(){ this.seedTick.update(v=>v+1); this.toast.success('Data refreshed'); }

  private hash(s:string){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h+= (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);} return (h>>>0)/4294967295; }
  private seeded(mult=1, wobble=0){
    const key = `${this.storeId()}|${this.timeframe()}|${this.seedTick()}`;
    const base = this.hash(key);
    return Math.max(0, (base*mult) + Math.sin(base*11.7)*wobble);
  }
  private tfScale(): number {
    return ({DTD:0.2,WTD:0.5,MTD:1,QTD:2.2,YTD:4.0} as Record<TF,number>)[this.timeframe()];
  }

  // ===== Demo Data Builders =====
  private buildWorkOrders(): WorkOrder[] {
    const base = Math.max(20, Math.round(26 * this.tfScale() * (0.85 + this.seeded(0.6))));
    const titles = [
      'Brake adjustment', 'Battery load test', 'Electrical diagnostic',
      'Detail & prep', 'Charger replacement', 'Hydraulic alignment',
      'Tire & wheel set', 'Noise after delivery', 'Door alignment', 'Accessory install'
    ];
    const assets = [
      'EZGO RXV #112', 'Club Car 48V #77', 'Evolution D5 #41',
      '12x16 Barn Shed', '12x20 Garage', 'Denago Rover S #19'
    ];
    const custs  = ['M. Jones','R. Chen','T. Brown','A. Gray','S. Patel','J. Rivera','L. Flores'];

    const sevs: Sev[] = ['High','Medium','Low'];
    const sts:  St[]  = ['Open','In Progress','Waiting Parts','Scheduled','Done','Cancelled'];
    const techs = ['D. Carter','L. Nguyen','K. Patel','A. Singh','T. Nguyen'];

    const arr: WorkOrder[] = [];
    for (let i=0;i<base;i++){
      const sv = sevs[(i+1)%3];
      const st = sts[(i+2)%6];
      const t  = techs[i%techs.length];
      const age = Math.round((this.seeded(10)*6) + (i%6)*2); // hours since open
      const eta = (i%5===0) ? 'Tomorrow' : (i%3===0 ? 'Today 4:30p' : 'Fri');
      arr.push({
        id: 4300+i,
        title: titles[i%titles.length],
        asset: assets[(i*2)%assets.length],
        severity: sv,
        status: st,
        tech: t,
        eta,
        openedAgo: age ? `${age}h ago` : 'now',
        customer: custs[(i*3)%custs.length]
      });
    }
    // Ensure some active
    if (!arr.some(x => ['Open','In Progress','Waiting Parts','Scheduled'].includes(x.status))) {
      arr[0].status = 'Open';
      arr[1].status = 'In Progress';
      arr[2].status = 'Waiting Parts';
      arr[3].status = 'Scheduled';
    }
    return arr;
  }

  private buildParts(): PartUsage[] {
    const skus = ['BAT-48V-AGM','TIRE-18-8.5','BRAKE-PAD-SET','CHGR-48V-A7','BOLT-M8-25','LIGHT-KIT-D5'];
    const desc = ['Battery (48V AGM)','Tire 18x8.5-8','Brake Pad Set','Charger 48V A7','Bolt M8 x 25','Light Kit Evolution D5'];
    const out: PartUsage[] = [];
    const sz = Math.max(10, Math.round(14 * (0.8 + this.seeded(0.5))));
    for (let i=0;i<sz;i++){
      const idx = i % skus.length;
      out.push({
        sku: skus[idx],
        desc: desc[idx],
        qty: 1 + (i % 3),
        woId: 4300 + i
      });
    }
    return out;
  }

  private workOrders = signal<WorkOrder[]>([]);
  private parts      = signal<PartUsage[]>([]);

  constructor(){
    this.workOrders.set(this.buildWorkOrders());
    this.parts.set(this.buildParts());
  }
  // Rebuild on changes
  private _ = computed(()=>{ this.timeframe(); this.seedTick(); this.storeId();
    this.workOrders.set(this.buildWorkOrders());
    this.parts.set(this.buildParts());
    return true;
  });

  // ===== Filters & Derived =====
  techList = computed(() => ['All','D. Carter','L. Nguyen','K. Patel','A. Singh','T. Nguyen']);

  wo = computed(() => {
    const q   = this.q().toLowerCase();
    const st  = this.status();
    const sv  = this.sev();
    const tx  = this.tech();

    return this.workOrders().filter(w =>
      (st === 'All' || w.status === st) &&
      (sv === 'All' || w.severity === sv) &&
      (tx === 'All' || w.tech === tx) &&
      (!q || w.title.toLowerCase().includes(q) || w.asset.toLowerCase().includes(q) || (''+w.id).includes(q) || w.customer.toLowerCase().includes(q))
    );
  });

  activeCount   = computed(() => this.wo().filter(w => ['Open','In Progress','Waiting Parts','Scheduled'].includes(w.status)).length);
  doneCount     = computed(() => this.wo().filter(w => w.status === 'Done').length);
  waitingParts  = computed(() => this.wo().filter(w => w.status === 'Waiting Parts').length);
  schedCount    = computed(() => this.wo().filter(w => w.status === 'Scheduled').length);
  highBacklog   = computed(() => this.wo().filter(w => w.severity === 'High' && ['Open','In Progress','Waiting Parts'].includes(w.status)).length);

  // KPIs (as strings for StatCard value)
  activeStr   = computed(() => `${this.activeCount()}`);
  doneStr     = computed(() => `${this.doneCount()}`);
  waitingStr  = computed(() => `${this.waitingParts()}`);
  schedStr    = computed(() => `${this.schedCount()}`);
  highBackStr = computed(() => `${this.highBacklog()}`);
  utilisStr   = computed(() => `${this.utilizationPct()}%`);

  // Utilization & Velocity (simple deterministic demo)
  utilizationPct = computed(() => Math.min(100, Math.round(68 + this.seeded(20, 8))));
  velocityWk     = computed(() => Math.max(1, Math.round(18 * (0.8 + this.seeded(0.5))))); // closed per week

  // Parts aggregates
  partsUsed = computed(() => this.parts().reduce((s,p)=> s+p.qty, 0));
  partsStr  = computed(() => `${this.partsUsed()}`);

  // ===== Charts =====
  ticketFlowChart = computed(() => {
    const base = Math.max(12, Math.round(16 * (0.8 + this.seeded(0.8))));
    const opened   = Array.from({length:12}).map((_,i)=> Math.max(8,  Math.round(base + Math.sin(i/1.7)*3 + this.seeded(2))));
    const resolved = Array.from({length:12}).map((_,i)=> Math.max(6,  Math.round(base - 1 + Math.cos(i/1.9)*2 + this.seeded(2))));
    return {
      chart:{ type:'area', height:260, toolbar:{show:false} },
      series:[{ name:'Opened', data: opened }, { name:'Resolved', data: resolved }],
      xaxis:{ categories:['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'] },
      dataLabels:{ enabled:false }, stroke:{ curve:'smooth', width:2 }, grid:{ borderColor:'#eee' }
    };
  });

  bySeverityChart = computed(()=> {
    const h = this.wo().filter(w=>w.severity==='High').length;
    const m = this.wo().filter(w=>w.severity==='Medium').length;
    const l = this.wo().filter(w=>w.severity==='Low').length;
    return {
      chart:{ type:'donut', height:240, toolbar:{show:false} },
      series:[h,m,l], labels:['High','Medium','Low'], legend:{ position:'bottom' }
    };
  });

  techUtilChart = computed(()=> ({
    chart:{ type:'bar', height:220, toolbar:{show:false} },
    plotOptions:{ bar:{ horizontal:true, borderRadius:4 } },
    series:[{
      name: 'Active WOs',
      data: ['D. Carter','L. Nguyen','K. Patel','A. Singh','T. Nguyen']
        .map(n => ({ x:n, y: this.wo().filter(w => w.tech===n && ['Open','In Progress','Waiting Parts','Scheduled'].includes(w.status)).length }))
    }],
    dataLabels:{ enabled:true }, grid:{ borderColor:'#eee' }
  }));

  partsChart = computed(()=> {
    // top SKUs by qty
    const grouped = new Map<string, number>();
    this.parts().forEach(p => grouped.set(p.sku, (grouped.get(p.sku) ?? 0) + p.qty));
    const top = Array.from(grouped.entries()).sort((a,b)=> b[1]-a[1]).slice(0,6);
    return {
      chart:{ type:'bar', height:220, toolbar:{show:false} },
      plotOptions:{ bar:{ distributed:true, borderRadius:4 } },
      series:[{ name:'Qty Used', data: top.map(([sku,qty]) => ({x:sku, y:qty})) }],
      dataLabels:{ enabled:true }, grid:{ borderColor:'#eee' }
    };
  });

  // Schedule (Mon-Sun)
  scheduleWeek = computed(() => {
    const items = (label:string, entries:any[]) => ({ label, items: entries });
    return [
      items('Mon', [{ time: '9:00a',  asset: 'EZGO RXV #112', tech: 'D. Carter' }]),
      items('Tue', [{ time: '10:30a', asset: 'Denago Rover S', tech: 'L. Nguyen' }]),
      items('Wed', [{ time: '1:00p',  asset: '12x16 Barn Shed', tech: 'K. Patel' }]),
      items('Thu', [{ time: '11:15a', asset: 'Evolution D5',   tech: 'A. Singh' }]),
      items('Fri', [{ time: '2:00p',  asset: 'Club Car 48V #77', tech: 'T. Nguyen' }]),
      items('Sat', [{ time: '9:45a',  asset: 'EZGO RXV #112',   tech: 'D. Carter' }]),
      items('Sun', []),
    ];
  });

  // ===== Actions (stubbed) =====
  assign(w: WorkOrder){ this.toast.info(`Assign WO #${w.id} to me`); }
  start(w: WorkOrder){ this.toast.success(`Started WO #${w.id}`); }
  complete(w: WorkOrder){ this.toast.success(`Completed WO #${w.id}`); }
  orderPart(w: WorkOrder){ this.toast.warn(`Order part for WO #${w.id}`); }
  addNote(w: WorkOrder){ this.toast.info(`Added note to WO #${w.id}`); }

  exportCsv(){
    const cols = [
      {key:'id', label:'ID', visible:true},
      {key:'title', label:'Title', visible:true},
      {key:'asset', label:'Asset', visible:true},
      {key:'severity', label:'Severity', visible:true},
      {key:'status', label:'Status', visible:true},
      {key:'tech', label:'Tech', visible:true},
      {key:'eta', label:'ETA', visible:true},
      {key:'openedAgo', label:'Opened', visible:true},
      {key:'customer', label:'Customer', visible:true},
    ];
    const esc = (v:any)=> { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
    const head = cols.filter(c=>c.visible).map(c=>c.label).join(',');
    const body = this.wo().map(r => cols.filter(c=>c.visible).map(c=>esc((r as any)[c.key])).join(',')).join('\n');
    const csv = `${head}\n${body}`;
    this.toast.info(`CSV ready (${this.wo().length} rows)`); console.debug(csv);
  }

  openCalendar(){ this.toast.info('Opening Service Schedule…'); }
  openReports(){ this.toast.info('Opening Service Reports…'); }
}
