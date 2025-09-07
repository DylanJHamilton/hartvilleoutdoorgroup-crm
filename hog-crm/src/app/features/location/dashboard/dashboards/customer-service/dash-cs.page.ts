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
type Priority = 'High'|'Medium'|'Low';
type Status = 'Open'|'In Progress'|'Waiting'|'Resolved'|'Closed';
type Channel = 'Phone'|'Email'|'Chat';

interface Ticket {
  id: number;
  subject: string;
  customer: string;
  priority: Priority;
  status: Status;
  assignee: string;
  updated: string; // "2h ago"
  slaDue: string;  // "in 4h" | "breached"
  channel: Channel;
}

@Component({
  standalone: true,
  selector: 'hog-dash-cs',
  imports: [
    CommonModule, RouterLink, NgOptimizedImage,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatChipsModule, MatMenuModule,
    HogChartDirective, StatCardComponent
  ],
  templateUrl: './dash-cs.page.html',
  styleUrls: ['./dash-cs.page.scss']
})
export class DashCsPage {
  // ===== Context =====
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  storeId   = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  store     = computed<LocationRef|undefined>(() => mockStores.find(s => s.id === this.storeId()));
  storeName = computed(() => this.store()?.name ?? `Store ${this.storeId()}`);

  // ===== Filters =====
  timeframe = signal<TF>('MTD');
  onTimeframe(tf: TF){ this.timeframe.set(tf); }

  priority = signal<Priority|'All'>('All');
  status   = signal<Status  |'All'>('All');
  channel  = signal<Channel |'All'>('All');
  q        = signal<string>('');

  // ===== Utilities =====
  private seedTick = signal(0);
  refresh(){ this.seedTick.update(v=>v+1); this.toast.success('Data refreshed'); }

  private hash(s:string){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h+= (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);} return (h>>>0)/4294967295; }
  private seeded(mult=1, wobble=0){
    const key = `${this.storeId()}|${this.timeframe()}|${this.seedTick()}`;
    const base = this.hash(key);
    return Math.max(0, (base*mult) + Math.sin(base*12.3)*wobble);
  }
  private tfScale(): number {
    return ({DTD:0.15,WTD:0.45,MTD:1,QTD:2.3,YTD:4.2} as Record<TF,number>)[this.timeframe()];
  }

  // ===== Demo Data: Tickets =====
  private buildTickets(): Ticket[] {
    const base = Math.max(18, Math.round(28 * this.tfScale() * (0.8 + this.seeded(0.6))));
    const names = ['A. Gray','B. Allen','C. Ortiz','D. Patel','E. Chen','F. Brooks','G. Rivera','H. Singh','I. Kim','J. Young','K. Parker','L. Flores'];
    const subs = [
      'Order status inquiry', 'Delivery reschedule', 'Warranty question',
      'Billing discrepancy', 'Accessory fit issue', 'Assembly instructions',
      'Pickup timing', 'Return request', 'Noise after service', 'Missing hardware'
    ];
    const prio: Priority[] = ['High','Medium','Low'];
    const sts: Status[] = ['Open','In Progress','Waiting','Resolved','Closed'];
    const ch: Channel[] = ['Phone','Email','Chat'];

    const tickets: Ticket[] = [];
    for (let i=0;i<base;i++){
      const p = prio[(i+2)%3];
      const s = sts[(i+1)%5];
      const c = ch[i%3];
      const assignee = ['M. Garcia','R. Brooks','J. Patel','T. Nguyen'][i%4];
      const ageH = Math.round(this.seeded(8)*8 + (i%5)*2);
      const updated = ageH === 0 ? 'now' : `${ageH}h ago`;
      const slaDue = (i%7===0) ? 'breached' : `in ${Math.max(1, 24 - (ageH%24))}h`;
      tickets.push({
        id: 8000+i,
        subject: subs[i%subs.length],
        customer: names[(i*3)%names.length],
        priority: p,
        status: s,
        assignee,
        updated,
        slaDue,
        channel: c
      });
    }
    // Ensure currently active are present
    if (!tickets.some(t => ['Open','In Progress','Waiting'].includes(t.status))) {
      tickets[0].status = 'Open';
      tickets[1].status = 'In Progress';
    }
    return tickets;
  }

  private allTickets = signal<Ticket[]>([]);
  constructor(){ this.allTickets.set(this.buildTickets()); }
  private _ = computed(()=>{ this.timeframe(); this.seedTick(); this.storeId(); this.allTickets.set(this.buildTickets()); return true; });

  // Filters
  tickets = computed(()=> {
    const q = this.q().toLowerCase();
    const pr = this.priority();
    const st = this.status();
    const ch = this.channel();
    return this.allTickets().filter(t =>
      (pr==='All' || t.priority===pr) &&
      (st==='All' || t.status===st) &&
      (ch==='All' || t.channel===ch) &&
      (!q || t.subject.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q) || (''+t.id).includes(q))
    );
  });

  // ===== Metrics =====
  activeCount   = computed(()=> this.tickets().filter(t => ['Open','In Progress','Waiting'].includes(t.status)).length);
  resolvedCount = computed(()=> Math.round(12 * (0.8 + this.seeded(0.6)) * this.tfScale()));
  breaches      = computed(()=> this.tickets().filter(t => t.slaDue==='breached').length);
  frtMinutes    = computed(()=> Math.max(5, Math.round(12 + this.seeded(10)*8)));     // First response time avg (min)
  csat          = computed(()=> Math.round(4.4*10 + this.seeded(6)*3)/10);            // 4.4..4.7
  reopenRate    = computed(()=> Math.round(3 + this.seeded(4)*3));                    // %
  backlogHigh   = computed(()=> this.tickets().filter(t => t.priority==='High' && ['Open','In Progress','Waiting'].includes(t.status)).length);

  // Strings for StatCardComponent (string | number)
  activeStr     = computed(() => `${this.activeCount()}`);
  resolvedStr   = computed(() => `${this.resolvedCount()}`);
  breachStr     = computed(() => `${this.breaches()}`);
  frtStr        = computed(() => `${this.frtMinutes()}m`);
  csatStr       = computed(() => `${this.csat().toFixed(1)}/5`);
  reopenStr     = computed(() => `${this.reopenRate()}%`);
  backlogHighStr= computed(() => `${this.backlogHigh()}`);

  // ===== Buckets / Breakdown =====
  priorityDist = computed(()=> {
    const h = this.tickets().filter(t=>t.priority==='High').length;
    const m = this.tickets().filter(t=>t.priority==='Medium').length;
    const l = this.tickets().filter(t=>t.priority==='Low').length;
    return {h,m,l};
  });

  channelDist = computed(()=> {
    const phone = this.tickets().filter(t=>t.channel==='Phone').length;
    const email = this.tickets().filter(t=>t.channel==='Email').length;
    const chat  = this.tickets().filter(t=>t.channel==='Chat').length;
    return {phone, email, chat};
  });

  agentLoad = computed(()=> {
    const agents = ['M. Garcia','R. Brooks','J. Patel','T. Nguyen','A. Singh'];
    return agents.map(a => ({
      x: a,
      y: this.tickets().filter(t => t.assignee===a && ['Open','In Progress','Waiting'].includes(t.status)).length
    }));
  });

  // ===== Charts =====
  ticketsTrendChart = computed(()=> {
    const base = Math.max(10, Math.round(18*(0.8 + this.seeded(0.6))));
    const series = Array.from({length:6}).map((_,i)=> Math.max(6, Math.round(base + Math.sin(i/1.7)*3 + this.seeded(2))));
    return {
      chart:{ type:'area', height:220, toolbar:{show:false} },
      series:[{ name:'Tickets', data: series }],
      xaxis:{ categories:['P1','P2','P3','P4','P5','P6'] },
      dataLabels:{ enabled:false },
      stroke:{ curve:'smooth', width:2 },
      grid:{ borderColor:'#eee' }
    };
  });

  responseTrendChart = computed(()=> {
    const base = this.frtMinutes();
    const series = Array.from({length:6}).map((_,i)=> Math.max(5, Math.round(base + Math.cos(i/1.6)*2 + this.seeded(1))));
    return {
      chart:{ type:'line', height:220, toolbar:{show:false} },
      series:[{ name:'FRT (min)', data: series }],
      xaxis:{ categories:['P1','P2','P3','P4','P5','P6'] },
      dataLabels:{ enabled:false },
      stroke:{ curve:'smooth', width:3 },
      grid:{ borderColor:'#eee' }
    };
  });

  priorityChart = computed(()=> {
    const d = this.priorityDist();
    return {
      chart:{ type:'donut', height:240, toolbar:{show:false} },
      series:[d.h, d.m, d.l],
      labels:['High','Medium','Low'],
      legend:{ position:'bottom' }
    };
  });

  channelChart = computed(()=> {
    const c = this.channelDist();
    return {
      chart:{ type:'bar', height:220, toolbar:{show:false} },
      plotOptions:{ bar:{ distributed:true, borderRadius:4 } },
      series:[{ name:'Tickets', data: [{x:'Phone', y:c.phone}, {x:'Email', y:c.email}, {x:'Chat', y:c.chat}] }],
      dataLabels:{ enabled:true },
      grid:{ borderColor:'#eee' }
    };
  });

  agentLoadChart = computed(()=> ({
    chart:{ type:'bar', height:220, toolbar:{show:false} },
    plotOptions:{ bar:{ horizontal:true, borderRadius:4 } },
    series:[{ name:'Active', data: this.agentLoad() }],
    dataLabels:{ enabled:true },
    grid:{ borderColor:'#eee' }
  }));

  // ===== Reviews / Live issues =====
  reviews = computed(()=> {
    const comments = [
      'Quick response, very helpful!',
      'Resolved my delivery issue same day.',
      'Took a bit long but friendly support.',
      'Great experience with the warranty process.',
      'Answer was unclear, needed a follow-up.'
    ];
    return Array.from({length:5}).map((_,i)=>({
      id: 5000+i,
      rating: (i===4) ? 3 : (i%3===0 ? 5 : 4),
      text: comments[i%comments.length],
      by: ['T. Cook','S. Rivera','M. Patel','J. Lee','A. Brown'][i%5],
      when: `${(i%6)+1}d ago`
    }));
  });

  liveIssues = computed(()=> [
    { id: 'LI-1001', title: 'Backorder: 12x16 Barn hardware kit', sev:'Medium', status:'Vendor ETA 5d', scope:'Company-wide' },
    { id: 'LI-1002', title: 'Cart charger recall batch #A7',       sev:'High',   status:'Swap program active', scope:'Company-wide' },
    { id: 'LI-1003', title: 'Website form duplicate tickets',       sev:'Low',    status:'Resolved; monitor',  scope:'Global' },
  ]);

  // ===== Actions (stubbed) =====
  assign(t: Ticket){ this.toast.info(`Assign ticket #${t.id} to me`); }
  escalate(t: Ticket){ this.toast.warn(`Escalated ticket #${t.id}`); }
  resolve(t: Ticket){ this.toast.success(`Resolved ticket #${t.id}`); }
  addNote(t: Ticket){ this.toast.info(`Added note to #${t.id}`); }
  exportCsv(){
    const cols = [
      {key:'id', label:'ID', visible:true},
      {key:'subject', label:'Subject', visible:true},
      {key:'customer', label:'Customer', visible:true},
      {key:'priority', label:'Priority', visible:true},
      {key:'status', label:'Status', visible:true},
      {key:'assignee', label:'Assignee', visible:true},
      {key:'updated', label:'Updated', visible:true},
      {key:'slaDue', label:'SLA Due', visible:true},
      {key:'channel', label:'Channel', visible:true},
    ];
    const rows = this.tickets();
    const csv = this.toCsv(cols, rows);
    this.toast.info(`CSV ready (${rows.length} rows)`); console.debug(csv);
  }
  openTickets(){ this.toast.info('Opening Tickets…'); }
  openKB(){ this.toast.info('Opening Knowledge Base…'); }
  openMacros(){ this.toast.info('Opening Macros…'); }
  openReports(){ this.toast.info('Opening CS Reports…'); }

  private toCsv(cols: {key:string; label:string; visible:boolean}[], rows: any[]): string {
    const vis = cols.filter(c=>c.visible);
    const head = vis.map(c=>c.label).join(',');
    const esc = (v:any)=> { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
    const body = rows.map(r => vis.map(c=>esc(r[c.key])).join(',')).join('\n');
    return `${head}\n${body}`;
  }
}
