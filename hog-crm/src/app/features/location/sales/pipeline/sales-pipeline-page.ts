import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule, CdkDragDrop, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';

import { HogChartDirective } from '../../../../shared/ui/chart/hog-chart.directive';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';
import { SalesCardComponent, SalesCardData } from '../../../../shared/ui/sales-card/sales-card.component';

import { makeSeed, seasonalityFactor, tfScale as tfScaleFn } from '../../../../shared/demo/seed.util';
import { mockStores } from '../../../../mock/locations.mock';
import { CommsService } from '../../../../shared/services/comms.service'; // <-- your CommsService path

type TF = 'MTD' | 'WTD' | 'DTD' | 'QTD' | 'YTD';
type Stage = 'Lead' | 'Qualified' | 'Quoted' | 'Won' | 'Lost';

export interface Card {
  id: string;
  title: string;
  customer: string;
  pipeline: string;
  stage: Stage;
  value: number;
  owner: string;
  age: number;    // days in stage
  phone?: string; // mock contact
  email?: string; // mock contact
}

@Component({
  standalone: true,
  selector: 'hog-sales-pipeline-page',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    MatIconModule,
    DragDropModule,       // ✅ Drag & Drop
    HogChartDirective,
    StatCardComponent,
  ],
  templateUrl: './sales-pipeline-page.html',
  styleUrls: ['./sales-pipeline-page.scss'],
})
export class SalesPipelinePage {
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private comms = inject(CommsService);

  // ---- Store context ----
  readonly storeId = signal<string>(mockStores?.[0]?.id ?? 's1');
  readonly storeName = computed(
    () => mockStores.find(s => s.id === this.storeId())?.name ?? 'Demo Store'
  );

  // ---- Role (UI only) ----
  readonly role = signal<'Sales' | 'Manager' | 'Owner/Admin'>('Sales');
  readonly isSales = computed(() => this.role() === 'Sales');

  // ---- Timeframe ----
  readonly timeframes: TF[] = ['DTD','WTD','MTD','QTD','YTD'];
  timeframe = signal<TF>('MTD');
  setTF(tf: TF) { this.timeframe.set(tf); this.regen(); }

  // ---- Filters ----
  q = signal('');
  owner = signal<'All' | string>('All');
  pipe  = signal<'All' | string>('All');
  stage = signal<Stage | 'All'>('All');

  owners = signal<( 'All' | string)[]>(['All','Alice','Ben','Riley Singh']);
  pipes  = signal<( 'All' | string)[]>(['All','Sheds','Golf Carts','Cabins','Furniture']);
  readonly stagesAll: (Stage | 'All')[] = ['All','Lead','Qualified','Quoted','Won','Lost'];
  readonly stagesNoAll: Stage[] = ['Lead','Qualified','Quoted','Won','Lost'];

  // For CDK lists
  readonly stageIds: Record<Stage, string> = {
    Lead: 'stage-Lead',
    Qualified: 'stage-Qualified',
    Quoted: 'stage-Quoted',
    Won: 'stage-Won',
    Lost: 'stage-Lost',
  };
  readonly connectedIds = Object.values(this.stageIds);

  // ---- Deterministic seed tick ----
  private tick = signal(0);
  refresh() { this.tick.update(v => v + 1); this.regen(); }

  // ---- Data + KPIs (computed from cards) ----
  private allCards = signal<Card[]>([]);
  wonTotal = computed(() => this.allCards().filter(c => c.stage === 'Won').reduce((s,c)=>s+c.value,0));
  wonCount = computed(() => this.allCards().filter(c => c.stage === 'Won').length);
  orders   = computed(() => this.allCards().filter(c => c.stage !== 'Lost').length);
  aov      = computed(() => this.wonCount() ? Math.round(this.wonTotal()/this.wonCount()) : 0);

  // ---- Small deterministic forecast chart ----
  forecastChart = computed(() => {
    const r = this.rng('FORECAST');
    const data = Array.from({length:6}).map((_,i)=> Math.round(1500 + r()*2200 + i*420));
    return {
      chart:{ type:'line', height:180, toolbar:{show:false} },
      stroke:{ curve:'smooth' },
      series:[{ name:'Forecast $', data }],
      xaxis:{ categories:['W1','W2','W3','W4','W5','W6'] },
    };
  });

  constructor() {
    this.regen();
  }

  // -------------------------
  //   Deterministic generator
  // -------------------------
  private rng(key: string) {
    const seedKey = `${this.storeId()}|${this.timeframe()}|PIPELINE|${key}|${this.tick()}`;
    return makeSeed(seedKey);
  }
  private tfScale(): number { return tfScaleFn(this.timeframe()); }

  private regen() {
    const r = this.rng('SEED');
    const owners = ['Riley Singh','Alice','Ben'];
    const pipelines = ['Golf Carts','Sheds','Cabins','Furniture'];

    const len = 12 + Math.floor(r()*9); // 12–20

    const month = new Date().getMonth();
    const season = seasonalityFactor(month, [1,1,1,1,1,1,1,1,1,1,1,1]);
    const tf = this.tfScale();

    const baseByPipe: Record<string, number[]> = {
      'Golf Carts': [7500, 9800, 11500, 12900],
      'Sheds':      [3200, 4800, 6200, 7800],
      'Cabins':     [18000, 24000, 32000, 42000],
      'Furniture':  [600, 900, 1400, 2200],
    };

    const customers = [
      'Taylor Co.','Henderson LLC','Klein Family','Gonzalez','Nguyen','Patel',
      'Carter','Lee','Thompson','Baker','Santiago','Martin','Ward','Diaz','Price'
    ];
    const titlesLead   = ['New Inquiry','Interested Lead','Website Form','Walk-in Lead'];
    const titlesQuote  = ['Formal Quote Sent','Price Provided','Configured & Quoted'];
    const titlesOther  = ['Sales Opportunity','Active Evaluation','Negotiation'];

    const pick = <T,>(arr: T[]) => arr[Math.floor(r()*arr.length)]!;

    // Stage distribution: 35% Lead, 25% Qualified, 20% Quoted, 10% Won, 10% Lost.
    const stageAt = (i: number): Stage => {
      const x = i/len;
      if (x < 0.35) return 'Lead';
      if (x < 0.60) return 'Qualified';
      if (x < 0.80) return 'Quoted';
      if (x < 0.90) return 'Won';
      return 'Lost';
    };

    const rows: Card[] = Array.from({length: len}, (_, i) => {
      const st = stageAt(i);
      const pipe = pick(pipelines);
      const baseArr = baseByPipe[pipe];
      const base = pick(baseArr);
      const wobble = 0.88 + r()*0.28; // ±14%
      const value = Math.round(base * wobble * season * tf);

      const title =
        st === 'Lead'   ? pick(titlesLead)  :
        st === 'Quoted' ? pick(titlesQuote) : pick(titlesOther);

      return {
        id: `P-${this.storeId()}-${this.timeframe()}-${this.tick()}-${i}`,
        title,
        customer: pick(customers),
        pipeline: pipe,
        stage: st,
        value,
        owner: pick(owners),
        age: 1 + Math.floor(r()*14),
        phone: r() > 0.2 ? `330-555-${String(1000 + Math.floor(r()*9000))}` : undefined,
        email: r() > 0.2 ? `lead${Math.floor(r()*9000)}@example.com` : undefined,
      };
    });

    this.allCards.set(rows);
  }

  // -------------------------
  //   Filtering / Grouping
  // -------------------------
  filteredByStage = computed(() => {
    const text = this.q().trim().toLowerCase();
    const ownerSel = this.owner();
    const pipeSel  = this.pipe();
    const stageSel = this.stage();

    const passOwner = (c: Card) => ownerSel === 'All' || !ownerSel || c.owner === ownerSel;
    const passPipe  = (c: Card) => pipeSel  === 'All' || !pipeSel  || c.pipeline === pipeSel;
    const passStage = (c: Card) => stageSel === 'All' || c.stage === stageSel;
    const passText  = (c: Card) =>
      !text ||
      c.title.toLowerCase().includes(text) ||
      c.customer.toLowerCase().includes(text) ||
      String(c.value).includes(text) ||
      c.pipeline.toLowerCase().includes(text) ||
      c.owner.toLowerCase().includes(text);

    const filtered = this.allCards().filter(c => passOwner(c) && passPipe(c) && passStage(c) && passText(c));

    const bucket: Record<Stage, Card[]> = { Lead:[], Qualified:[], Quoted:[], Won:[], Lost:[] };
    for (const c of filtered) bucket[c.stage].push(c);
    (Object.keys(bucket) as Stage[]).forEach(k => bucket[k].sort((a,b)=> a.age - b.age));
    return (Object.keys(bucket) as Stage[]).map(stage => ({ stage, cards: bucket[stage] }));
  });

  // -------------------------
  //   Drag & Drop
  // -------------------------
  drop(ev: CdkDragDrop<Card[]>, destStage: Stage) {
    // Reorder within same column
    if (ev.previousContainer === ev.container) {
      moveItemInArray(ev.container.data, ev.previousIndex, ev.currentIndex);
      return;
    }
    // Move across columns
    const prevList = ev.previousContainer.data;
    const nextList = ev.container.data;
    transferArrayItem(prevList, nextList, ev.previousIndex, ev.currentIndex);

    const moved = nextList[ev.currentIndex];
    if (!moved) return;

    // Update global list with new stage (KPIs recompute)
    const rows = this.allCards().map(row =>
      row.id === moved.id ? { ...row, stage: destStage } : row
    );
    this.allCards.set(rows);

    // Optional toast
    this.snack.open(`Moved “${moved.title}” → ${destStage}`, 'OK', { duration: 900 });
  }

  // -------------------------
  //   Actions
  // -------------------------
  reassign(c: Card){ this.snack.open(`Reassign “${c.title}” (stub)`, 'OK', { duration: 1200 }); }

  moveStage(c: Card, next?: Stage){
    if (!next || next === c.stage) return;
    const rows = this.allCards().map(row => row.id === c.id ? { ...row, stage: next } : row);
    this.allCards.set(rows);
    this.snack.open(`Moved “${c.title}” → ${next}`, 'OK', { duration: 1000 });
  }

  callLead(c: Card){ if (c.phone) this.comms.call(c.phone); else this.snack.open('No phone on record', 'OK', {duration: 1200}); }
  quoteLead(c: Card){ this.snack.open(`Quote workflow for “${c.title}”`, 'OK', { duration: 1000 }); }

  openCard(c: Card){
    const numericId = Number(c.id.replace(/\D+/g, '').slice(-4)) || Math.floor(Math.random()*9000)+1000;

    this.dialog.open(SalesCardComponent, {
      width: '760px',
      data: <SalesCardData>{
        id: numericId,
        customer: c.customer,
        title: c.title,
        pipeline: c.pipeline as SalesCardData['pipeline'],
        stage: c.stage as SalesCardData['stage'],
        value: c.value,
        owner: c.owner,
        age: c.age,
      },
      panelClass: 'hog-light-dialog',
      autoFocus: false,
    }).afterClosed().subscribe(res => {
      const next = (res?.moveTo ?? undefined) as Stage | undefined;
      if (next) this.moveStage(c, next);
    });
  }

  resetFilters(){
    this.q.set('');
    this.owner.set('All');
    this.pipe.set('All');
    this.stage.set('All');
  }
}
