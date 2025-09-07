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
type Stage = 'Lead'|'Qualified'|'Quoted'|'Verbal Yes'|'Won'|'Lost';
type Status = 'Open'|'Stalled'|'Won'|'Lost';

interface Opportunity {
  id: number;
  customer: string;
  product: string;
  stage: Stage;
  status: Status;
  value: number;     // dollars
  age: number;       // days in stage
  updated: string;   // label
}

@Component({
  standalone: true,
  selector: 'hog-dash-sales',
  imports: [
    CommonModule, RouterLink, NgOptimizedImage,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatChipsModule, MatMenuModule,
    HogChartDirective, StatCardComponent
  ],
  templateUrl: './dash-sales.page.html',
  styleUrls: ['./dash-sales.page.scss']
})
export class DashSalesPage {
  // ===== Context =====
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  // Store and Salesperson identity
  storeId   = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  salesId   = computed(() => this.route.snapshot.queryParamMap.get('salesId') ?? 'rep-101'); // allow ?salesId=...
  store     = computed<LocationRef|undefined>(() => mockStores.find(s => s.id === this.storeId()));
  storeName = computed(() => this.store()?.name ?? `Store ${this.storeId()}`);
  repName   = computed(() => this.nameFromSalesId(this.salesId()));

  // Role awareness (UI only; no route guard here)
  role = signal<'Sales'|'Manager'|'Other'>('Sales');
  isSales = computed(() => this.role() === 'Sales');

  // Filters
  timeframe = signal<TF>('MTD');
  onTimeframe(tf: TF) { this.timeframe.set(tf); }

  stage = signal<Stage | 'All'>('All');
  status = signal<Status | 'All'>('All');
  q = signal<string>('');

  // Seeder controls
  private seedTick = signal(0);
  refresh(){ this.seedTick.update(v=>v+1); this.toast.success('Data refreshed'); }

  private hash(s:string){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h+= (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);} return (h>>>0)/4294967295; }
  private seeded(mult=1, wobble=0){
    const key = `${this.storeId()}|${this.salesId()}|${this.timeframe()}|${this.seedTick()}`;
    const base = this.hash(key);
    return Math.max(0, (base*mult) + Math.sin(base*12.3)*wobble);
  }
  private tfScale(): number {
    return ({DTD:0.15,WTD:0.4,MTD:1,QTD:2.2,YTD:4.1} as Record<TF,number>)[this.timeframe()];
  }

  // ===== Personal Performance (rep-centric) =====
  private basePipelineCount = computed(()=> {
    const repBias = 0.75 + this.seeded(0.7); // 0.75..1.45
    return Math.max(12, Math.round(30 * this.tfScale() * repBias));
  });

  private buildPipeline(): Opportunity[] {
    const n = this.basePipelineCount();
    const stages: Stage[] = ['Lead','Qualified','Quoted','Verbal Yes','Won','Lost'];
    const products = [
      'Evolution D5 Maverick 4','Evolution Forester 6','Dash Elite 48V',
      'Denago Rover S','12x16 Barn Shed','Poly Adirondack Chair'
    ];
    const customers = ['B. Allen','M. Carter','T. Diaz','L. Evans','J. Flores','A. Gupta','H. Howard','I. Ibarra','K. Jones','R. King','S. Lee','N. Moore','O. Novak','P. Ortiz','Q. Park','R. Quinn','S. Reed','T. Shah','U. Tran','V. Usher','W. Vance','X. Wynn','Y. Young','Z. Zhao'];
    const arr: Opportunity[] = [];
    for (let i=0;i<n;i++){
      const st = stages[(i + Math.round(this.seeded(10)*10)) % stages.length];
      const isClosed = st === 'Won' || st === 'Lost';
      const status: Status = isClosed ? (st as any) : (this.seeded(1) > 0.85 ? 'Stalled' : 'Open');
      const prod = products[(i*3 + 2) % products.length];
      const cust = customers[(i*7 + 3) % customers.length];
      const value = this.pickValue(prod);
      const age = Math.max(0, Math.round(this.seeded(20)*20 + (i%9)));
      const updated = age === 0 ? 'Today' : `${Math.min(age, 28)}d ago`;
      arr.push({ id: 6000+i, customer: cust, product: prod, stage: st, status, value, age, updated });
    }
    // ensure some wins/losses
    if (!arr.some(a=>a.stage==='Won'))  arr[0].stage = 'Won',  arr[0].status='Won';
    if (!arr.some(a=>a.stage==='Lost')) arr[1].stage = 'Lost', arr[1].status='Lost';
    return arr;
  }
  private pickValue(product:string): number {
    if (product.includes('Forester')) return 12995;
    if (product.includes('Maverick') || product.includes('Denago')) return 8995;
    if (product.includes('Dash Elite')) return 7995;
    if (product.includes('Barn Shed')) return 4899;
    return 299;
  }

  private pipelineAll = signal<Opportunity[]>([]);
  constructor(){ this.pipelineAll.set(this.buildPipeline()); }
  private _ = computed(()=>{ this.timeframe(); this.seedTick(); this.storeId(); this.salesId(); this.pipelineAll.set(this.buildPipeline()); return true; });

  // Filtered opportunities
  filtered = computed(()=> {
    const q = this.q().toLowerCase();
    const stg = this.stage();
    const stat = this.status();
    return this.pipelineAll().filter(p =>
      (stg==='All'   || p.stage===stg) &&
      (stat==='All'  || p.status===stat) &&
      (!q || p.customer.toLowerCase().includes(q) || p.product.toLowerCase().includes(q) || (''+p.id).includes(q))
    );
  });

  // Performance core metrics (personal)
  mtdSales   = computed(()=> this.pipelineAll().filter(p=>p.stage==='Won').reduce((a,b)=>a+b.value,0));
  aov        = computed(()=> {
    const wins = this.pipelineAll().filter(p=>p.stage==='Won');
    const count = wins.length || 1;
    return Math.round(wins.reduce((a,b)=>a+b.value,0) / count);
  });
  openPipe$  = computed(()=> this.pipelineAll().filter(p => p.status==='Open' || p.status==='Stalled').reduce((a,b)=>a+b.value,0));
  winRate    = computed(()=> {
    const wins = this.pipelineAll().filter(p=>p.stage==='Won').length;
    const closed = wins + this.pipelineAll().filter(p=>p.stage==='Lost').length;
    return closed ? Math.round((wins/closed)*100) : 0;
  });
  meetings   = computed(()=> Math.max(1, Math.round(this.seeded(6)*6 + 3))); // scheduled this tf
  tasksDue   = computed(()=> Math.max(1, Math.round(this.seeded(10)*10 + this.filtered().length*0.08)));

  // Quota & goals (computed SMART suggestions)
  // Base quotas vary deterministically by rep + tf
  baseQuota = computed(()=> {
    const base = 65000; // monthly
    const tf = this.timeframe();
    const scale = ({DTD:0.15,WTD:0.4,MTD:1,QTD:3.0,YTD:12} as Record<TF,number>)[tf];
    const repBias = 0.85 + this.seeded(0.4)*0.3; // 0.85..1.15
    return Math.round(base * scale * repBias);
  });
  attainmentPct = computed(()=> {
    const cur = this.mtdSales();
    const q = this.baseQuota() || 1;
    return Math.min(200, Math.round((cur / q) * 100)); // cap for demo
  });
  coverageX = computed(()=> {
    const q = this.baseQuota() || 1;
    const coverage = this.openPipe$() / q;
    return Math.round(coverage * 10) / 10; // 1 decimal
  });

  coaching = computed(() => {
    const items: {title:string; why:string; action:string}[] = [];
    // Coverage
    if (this.coverageX() < 3) {
      items.push({
        title: 'Grow pipeline to 3× coverage',
        why:   `Current coverage is ${this.coverageX()}× vs target 3×.`,
        action:'Add 6–10 net new leads this week; book 3 discovery calls.'
      });
    }
    // Win rate
    if (this.winRate() < 35) {
      items.push({
        title: 'Improve win rate to 35%+',
        why:   `Win rate is ${this.winRate()}%.`,
        action:'Tighten qualification (BANT), trial close after demo, send recap within 24h.'
      });
    }
    // AOV upsell
    if (this.aov() < 8500) {
      items.push({
        title: 'Lift AOV by $300–$600',
        why:   `AOV is ${(this.aov()).toLocaleString('en-US',{style:'currency',currency:'USD'})}.`,
        action:'Bundle accessories (seats, lights, lift kit); present Good/Better/Best pricing.'
      });
    }
    // Activity nudge
    if (this.meetings() < 5) {
      items.push({
        title: 'Book 2 more meetings',
        why:   `Meetings set: ${this.meetings()}.`,
        action:'Call warm MQLs; send Calendly link in follow-up; ask for referrals on recent wins.'
      });
    }
    // Always include quick-win
    items.push({
      title:'Follow-up sprint (12 touches)',
      why:'Consistent follow-up increases response rate by 70%+ in our mix.',
      action:'Block 45m: 4 calls + 4 SMS + 4 emails across 12 opps (use existing templates).'
    });
    return items;
  });

  // Charts
  funnelChart = computed(()=> {
    const s: Record<Stage, number> = { Lead:0, Qualified:0, Quoted:0, 'Verbal Yes':0, Won:0, Lost:0 };
    for (const p of this.filtered()) s[p.stage]++;
    return {
      chart:{type:'bar', height:260, toolbar:{show:false}},
      plotOptions:{bar:{horizontal:true, distributed:true, borderRadius:4}},
      series:[{ data:[
        {x:'Lead', y:s['Lead']}, {x:'Qualified', y:s['Qualified']}, {x:'Quoted', y:s['Quoted']},
        {x:'Verbal Yes', y:s['Verbal Yes']}, {x:'Won', y:s['Won']}
      ]}],
      dataLabels:{enabled:true},
      grid:{borderColor:'#eee'}
    };
  });

  winrateChart = computed(()=> {
    const base = this.winRate();
    const data = Array.from({length:6}).map((_,i)=> Math.max(5, Math.min(95, Math.round(base + Math.sin(i/1.7 + this.seeded(3))*10))));
    return {
      chart:{type:'line', height:220, toolbar:{show:false}},
      series:[{ name:'Win rate %', data }],
      xaxis:{ categories:['P1','P2','P3','P4','P5','P6'] },
      stroke:{curve:'smooth', width:3},
      dataLabels:{enabled:false},
      grid:{borderColor:'#eee'}
    };
  });

  forecastChart = computed(()=> {
    const weights: Record<Stage, number> = { Lead:0.1, Qualified:0.25, Quoted:0.45, 'Verbal Yes':0.75, Won:1.0, Lost:0 };
    const sum = (st:Stage)=> this.filtered().filter(p=>p.stage===st).reduce((a,b)=>a+b.value*weights[st],0);
    const data = ['Lead','Qualified','Quoted','Verbal Yes','Won'].map(st => Math.round(sum(st as Stage)));
    return {
      chart:{type:'area', height:240, toolbar:{show:false}},
      series:[{ name:'Forecast $', data }],
      xaxis:{ categories:['Lead','Qualified','Quoted','Verbal Yes','Won'] },
      stroke:{curve:'smooth', width:2},
      dataLabels:{enabled:false},
      grid:{borderColor:'#eee'}
    };
  });

  // Inventory (view-only)
  topSellers = computed(()=> [
    { name: 'Evolution D5 Maverick 4', brand:'Evolution', img:'/assets/demo/carts/evolution-d5.jpg',         price:9995,  sold: Math.round(12*(0.7+this.seeded(0.5))) },
    { name: 'Evolution Forester 6',    brand:'Evolution', img:'/assets/demo/carts/evolution-forester-6.jpg', price:12995, sold: Math.round(10*(0.7+this.seeded(0.5))) },
    { name: 'Denago Rover S',          brand:'Denago',    img:'/assets/demo/carts/denago-rover.jpg',         price:8995,  sold: Math.round(9*(0.7+this.seeded(0.5)))  },
  ]);

  availableInventory = computed(()=> [
    { sku:'EV-D5',  name:'Evolution D5 Maverick 4', onHand: 6 + Math.round(this.seeded(6)*4),  msrp: 9995 },
    { sku:'EV-F6',  name:'Evolution Forester 6',    onHand: 4 + Math.round(this.seeded(6)*3),  msrp: 12995 },
    { sku:'DN-ROV', name:'Denago Rover S',          onHand: 5 + Math.round(this.seeded(6)*3),  msrp: 8995 },
    { sku:'DS-ELT', name:'Dash Elite 48V',          onHand: 3 + Math.round(this.seeded(6)*4),  msrp: 7995 },
    { sku:'SH-1216',name:'12x16 Barn Shed',         onHand: 7 + Math.round(this.seeded(6)*5),  msrp: 4899 },
  ]);

  // Docs / Writeups
  salesDocs = computed(()=> {
    const base = [
      { id: 9101, kind:'Quote',     title:'Quote — Evolution D5', when:'2d ago' },
      { id: 9102, kind:'Writeup',   title:'Sales Writeup — Forester 6', when:'3d ago' },
      { id: 9103, kind:'Invoice',   title:'Invoice — Dash Elite 48V', when:'5d ago' },
      { id: 9104, kind:'PO',        title:'PO — Barn Shed 12x16', when:'6d ago' },
      { id: 9105, kind:'Spec',      title:'Spec Sheet — Denago Rover', when:'7d ago' },
    ];
    return base.slice(0, Math.max(3, Math.round(5*(0.6+this.seeded(0.4)))));
  });

  // Actions (stubbed)
  openPipeline(){ this.toast.info('Opening Pipeline…'); }
  openWriteups(){ this.toast.info('Opening Sales Writeups…'); }
  openReports(){ this.toast.info('Opening Performance Reports…'); }
  openSalesDocs(){ this.toast.info('Opening Sales Documents…'); }
  startCall(op: Opportunity){ this.toast.info(`Calling ${op.customer} about ${op.product}`); }
  sendQuote(op: Opportunity){ this.toast.success(`Quote sent for #${op.id}`); }
  nextBestAction(){ this.toast.success('Added 12-touch follow-up sprint to your task list'); }
  exportCsv(){
    const cols = [
      {key:'id', label:'ID', visible:true},
      {key:'customer', label:'Customer', visible:true},
      {key:'product', label:'Product', visible:true},
      {key:'stage', label:'Stage', visible:true},
      {key:'status', label:'Status', visible:true},
      {key:'value', label:'Value', visible:true},
      {key:'age', label:'Age (d)', visible:true},
      {key:'updated', label:'Updated', visible:true},
    ];
    const rows = this.filtered().map(r=>({ ...r, value: `$${r.value.toLocaleString()}` }));
    const csv = this.toCsv(cols, rows);
    this.toast.info(`CSV ready (${rows.length} rows)`); console.debug(csv);
  }

  // Helpers
  private toCsv(cols: {key:string; label:string; visible:boolean}[], rows: any[]): string {
    const vis = cols.filter(c=>c.visible);
    const head = vis.map(c=>c.label).join(',');
    const esc = (v:any)=> { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
    const body = rows.map(r => vis.map(c=>esc(r[c.key])).join(',')).join('\n');
    return `${head}\n${body}`;
  }
  private nameFromSalesId(id: string): string {
    const map: Record<string,string> = {
      'rep-101':'Sam Sales','rep-102':'Taylor Kim','rep-103':'Riley Singh','rep-104':'Morgan Diaz'
    };
    return map[id] ?? 'Sales Rep';
  }
}
