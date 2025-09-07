import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
type Status = 'OK'|'Low';
type Cat =
  | 'Sheds & Garages'
  | 'Playsets & Trampolines'
  | 'Golf Carts'
  | 'Cabins & Structures'
  | 'Parts & Accessories';

interface InvRow {
  id: number;
  category: Cat;
  sub: string;
  sku: string;
  name: string;
  onHand: number;
  lowAt: number;
  reserved: number;
  status: Status;
  turns: number;     // annualized
  leadDays: number;  // pretend supplier lead time
  cost: number;      // unit cost
}

interface Receipt {
  id: number;
  date: string;  // '2025-09-03'
  sku: string;
  name: string;
  qty: number;
  supplier: string;
  cost: number;
}

@Component({
  standalone: true,
  selector: 'hog-dash-inventory',
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatChipsModule, MatMenuModule,
    HogChartDirective, StatCardComponent
  ],
  templateUrl: './dash-inventory.page.html',
  styleUrls: ['./dash-inventory.page.scss']
})
export class DashInventoryPage {
  // ===== Context =====
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  storeId   = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  store     = computed<LocationRef|undefined>(() => mockStores.find(s => s.id === this.storeId()));
  storeName = computed(() => this.store()?.name ?? `Store ${this.storeId()}`);

  // ===== Filters =====
  timeframe = signal<TF>('MTD');
  onTimeframe(tf: TF){ this.timeframe.set(tf); }
  cat = signal<Cat | 'All'>('All');
  status = signal<Status | 'All'>('All');
  q = signal('');

  // ===== Seeding utilities =====
  private seedTick = signal(0);
  refresh(){ this.seedTick.update(v=>v+1); this.toast.success('Inventory refreshed'); }

  private hash(s:string){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h+= (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);} return (h>>>0)/4294967295; }
  private seeded(mult=1, wobble=0){
    const key = `${this.storeId()}|${this.timeframe()}|${this.seedTick()}`;
    const base = this.hash(key);
    return Math.max(0, (base*mult) + Math.sin(base*10.7)*wobble);
  }
  private tfScale(): number {
    return ({DTD:0.3,WTD:0.6,MTD:1,QTD:2.2,YTD:4.2} as Record<TF,number>)[this.timeframe()];
  }

  // ===== Demo Data =====
  private categories: Cat[] = [
    'Sheds & Garages',
    'Playsets & Trampolines',
    'Golf Carts',
    'Cabins & Structures',
    'Parts & Accessories'
  ];
  private suppliers = ['HOP Manufacturing','Evolution Carts','Denago','EZGO Parts Co.','TriCounty Structures','Club Car Refurb'];

  private buildRows(): InvRow[] {
    const base = Math.max(60, Math.round(80 * (0.9 + this.seeded(0.8))));
    const rows: InvRow[] = [];
    for (let i=0;i<base;i++){
      const category = this.categories[i % this.categories.length];
      const sub = (
        category === 'Golf Carts' ? 'Evolution / Denago / Dash' :
        category === 'Parts & Accessories' ? 'Batteries / Tires' :
        category === 'Sheds & Garages' ? '10x12 / 12x16 / 10x20' :
        category === 'Playsets & Trampolines' ? 'A3 / B2 / 12ft' :
        '12x24 / 14x28'
      );
      const sku = `${category.split(' ')[0].toUpperCase()}-${1000+i}`;
      const name = (
        category === 'Golf Carts' ? (i%2===0?'Evolution D5 Maverick':'Denago Rover S') :
        category === 'Parts & Accessories' ? (i%2===0?'48V AGM Battery':'Tire 18x8.5-8') :
        category === 'Sheds & Garages' ? (i%2===0?'12x16 Barn Shed':'12x20 Garage') :
        category === 'Playsets & Trampolines' ? (i%2===0?'Poly Playset A3':'12ft Trampoline') :
        '14x28 Cabin'
      );
      const lowAt = category === 'Parts & Accessories' ? 90 : (category === 'Golf Carts' ? 30 : 25);
      const onHand = Math.max(0, Math.round(lowAt + (this.seeded(40, 14) - 20) + (i%12)));
      const reserved = Math.max(0, Math.round((onHand * 0.12) + (i%3)));
      const status: Status = onHand <= lowAt ? 'Low' : 'OK';
      const turns = Math.max(1, Math.round((category==='Parts & Accessories' ? 8 : 4) + this.seeded(2)));
      const leadDays =  category==='Parts & Accessories' ? 7 : (category==='Golf Carts' ? 28 : 21);
      const cost = (
        category === 'Golf Carts' ? (9000 + (i%5)*400) :
        category === 'Sheds & Garages' ? (4500 + (i%4)*250) :
        category === 'Cabins & Structures' ? (9800 + (i%3)*500) :
        category === 'Playsets & Trampolines' ? (1200 + (i%4)*120) :
        120 + (i%4)*15
      );
      rows.push({
        id: 7000+i, category, sub, sku, name, onHand, lowAt, reserved, status, turns, leadDays, cost
      });
    }
    return rows;
  }

  private buildReceipts(): Receipt[] {
    const base = Math.max(18, Math.round(24 * this.tfScale() * (0.85 + this.seeded(0.5))));
    const out: Receipt[] = [];
    for (let i=0;i<base;i++){
      const cat = this.categories[i % this.categories.length];
      const sku = `${cat.split(' ')[0].toUpperCase()}-${1200+i}`;
      const name = cat==='Golf Carts' ? 'Evolution D5 Maverick' :
                   cat==='Parts & Accessories' ? '48V AGM Battery' :
                   cat==='Sheds & Garages' ? '12x16 Barn Shed' :
                   cat==='Playsets & Trampolines' ? 'Poly Playset A3' : '14x28 Cabin';
      const qty = 1 + (i % 6);
      const supplier = this.suppliers[i % this.suppliers.length];
      const cost = (cat==='Parts & Accessories' ? 140 : cat==='Golf Carts' ? 9200 : cat==='Playsets & Trampolines' ? 1250 : cat==='Sheds & Garages' ? 4700 : 10000);
      // simple recent-ish date
      const day = 3 + (i % 24);
      out.push({
        id: 50000 + i,
        date: `2025-09-${day.toString().padStart(2,'0')}`,
        sku, name, qty, supplier, cost
      });
    }
    return out;
  }

  private allRows = signal<InvRow[]>([]);
  private receipts = signal<Receipt[]>([]);

  constructor(){
    this.allRows.set(this.buildRows());
    this.receipts.set(this.buildReceipts());
  }

  // Re-seed on changes
  private _ = computed(()=>{ this.timeframe(); this.seedTick(); this.storeId();
    this.allRows.set(this.buildRows());
    this.receipts.set(this.buildReceipts());
    return true;
  });

  // ===== Derived / filtering =====
  catOptions = computed(() => ['All', ...this.categories]);
  rows = computed(() => {
    const q = this.q().toLowerCase();
    const cat = this.cat();
    const st = this.status();
    return this.allRows().filter(r =>
      (cat==='All' || r.category===cat) &&
      (st==='All' || r.status===st) &&
      (!q || r.sku.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
    );
  });
  lowRows = computed(() => this.rows().filter(r => r.status==='Low'));

  // KPIs
  onHandTotal = computed(() => this.rows().reduce((s,r)=> s + r.onHand, 0));
  lowCount    = computed(() => this.rows().filter(r => r.status==='Low').length);
  avgTurns    = computed(() => {
    const list = this.rows(); if (!list.length) return 0;
    return Math.round((list.reduce((s,r)=> s + r.turns, 0) / list.length) * 10)/10;
  });
  mtdReceipts = computed(() => this.receipts().reduce((s,r)=> s + r.qty, 0));

  // For StatCard (strings!)
  onHandStr = computed(() => `${this.onHandTotal()}`);
  lowStr    = computed(() => `${this.lowCount()}`);
  turnsStr  = computed(() => `${this.avgTurns()}`);
  recStr    = computed(() => `${this.mtdReceipts()}`);

  // ===== Charts =====
  byCatChart = computed(() => {
    const groups = new Map<string, number>();
    this.rows().forEach(r => groups.set(r.category, (groups.get(r.category) ?? 0) + r.onHand));
    const ent = Array.from(groups.entries());
    return {
      chart:{ type:'bar', height:240, toolbar:{show:false} },
      plotOptions:{ bar:{ distributed:true, borderRadius:4 } },
      series:[{ name:'On Hand', data: ent.map(([k,v])=>({x:k, y:v})) }],
      dataLabels:{ enabled:true }, grid:{ borderColor:'#eee' }
    };
  });

  lowRiskChart = computed(() => {
    const low = this.rows().filter(r=>r.status==='Low').length;
    const ok  = Math.max(0, this.rows().length - low);
    return {
      chart:{ type:'donut', height:240, toolbar:{show:false} },
      series:[low, ok], labels:['Low','OK'], legend:{ position:'bottom' }
    };
  });

  turnsTrendChart = computed(() => {
    const base = Math.max(3, Math.round(this.avgTurns() || 4));
    const data = Array.from({length:8}).map((_,i)=> Math.max(2, Math.round(base + Math.cos(i/1.7)*0.6 + (this.seeded(0.8)-0.4))));
    return {
      chart:{ type:'line', height:220, toolbar:{show:false} },
      series:[{ name:'Turns', data }],
      xaxis:{ categories:['P1','P2','P3','P4','P5','P6','P7','P8'] },
      dataLabels:{ enabled:false }, stroke:{ curve:'smooth', width:3 }, grid:{ borderColor:'#eee' }
    };
  });

  receiptsHistChart = computed(() => {
    // group by day (simple 1..24 bins)
    const buckets = new Map<string, number>();
    this.receipts().forEach(r => {
      const d = r.date.slice(-2); // day
      buckets.set(d, (buckets.get(d) ?? 0) + r.qty);
    });
    const items = Array.from(buckets.entries()).sort((a,b)=> (+a[0])-(+b[0]));
    return {
      chart:{ type:'bar', height:220, toolbar:{show:false} },
      plotOptions:{ bar:{ borderRadius:4 } },
      series:[{ name:'Qty', data: items.map(([d,qty]) => ({x:d, y:qty})) }],
      dataLabels:{ enabled:true }, grid:{ borderColor:'#eee' }
    };
  });

  // ===== Actions =====
  reorder(r: InvRow){
    const qty = Math.max(1, Math.round((r.lowAt*1.5 + r.reserved) - r.onHand));
    this.toast.warn(`Reorder ${r.sku} (${qty} units) • lead ${r.leadDays}d`);
  }
  receive(r: InvRow){ this.toast.success(`Receive against PO for ${r.sku}`); }
  adjust(r: InvRow){ this.toast.info(`Adjust on-hand for ${r.sku}`); }
  count(r: InvRow){ this.toast.info(`Cycle count started for ${r.sku}`); }

  exportCsv(){
    const cols = [
      {key:'category', label:'Category', visible:true},
      {key:'sub',      label:'Sub',      visible:true},
      {key:'sku',      label:'SKU',      visible:true},
      {key:'name',     label:'Name',     visible:true},
      {key:'onHand',   label:'On Hand',  visible:true},
      {key:'lowAt',    label:'Low @',    visible:true},
      {key:'reserved', label:'Reserved', visible:true},
      {key:'status',   label:'Status',   visible:true},
      {key:'turns',    label:'Turns',    visible:true},
      {key:'leadDays', label:'Lead (d)', visible:true},
      {key:'cost',     label:'Cost',     visible:true},
    ];
    const esc = (v:any)=> { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
    const head = cols.filter(c=>c.visible).map(c=>c.label).join(',');
    const body = this.rows().map(r => cols.filter(c=>c.visible).map(c=>esc((r as any)[c.key])).join(',')).join('\n');
    const csv = `${head}\n${body}`;
    this.toast.info(`CSV ready (${this.rows().length} rows)`); console.debug(csv);
  }
}
