import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SalesCardComponent, SalesCardData } from '../../../../shared/ui/sales-card/sales-card.component';
import { HogChartDirective } from '../../../../shared/ui/chart/hog-chart.directive';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';

import { CommsService } from '../../../../shared/services/comms.service';
import { makeSeed, tfScale, seasonalityFactor } from '../../../../shared/demo/seed.util';
import { mockStores } from '../../../../mock/locations.mock';

type TF = 'DTD'|'WTD'|'MTD'|'QTD'|'YTD';
type LeadStatus = 'New'|'Working'|'Qualified'|'Quoted'|'Won'|'Lost';

export interface Lead {
  id: string;
  name: string;
  title: string;      // interest / product hint
  pipeline: 'Sheds'|'Golf Carts'|'Cabins'|'Furniture'|string;
  status: LeadStatus;
  owner?: string;
  value?: number;
  phone?: string;
  email?: string;
  age: number;        // days since created
  source: 'Web'|'Walk-in'|'Phone'|'Event'|'Referral'|string;
  duplicateOf?: string; // id of canonical lead if de-duped
}

@Component({
  standalone: true,
  selector: 'hog-leads-page',
  imports: [
    CommonModule,

    // UI
    MatTableModule, MatSortModule, MatPaginatorModule, MatCheckboxModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule,

    // Services
    MatSnackBarModule, MatDialogModule,

    // App UI
    StatCardComponent, HogChartDirective,
    SalesCardComponent,
  ],
  templateUrl: './leads-page.html',
  styleUrls: ['./leads-page.scss'],
})
export class LeadsPage {
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private comms = inject(CommsService);

  // ---- Context ----
  readonly storeId = signal<string>(mockStores?.[0]?.id ?? 's1');
  readonly storeName = computed(() => mockStores.find(s => s.id === this.storeId())?.name ?? 'Demo Store');

  // ---- Controls ----
  readonly timeframes: TF[] = ['DTD','WTD','MTD','QTD','YTD'];
  timeframe = signal<TF>('MTD');
  setTF(tf: TF){ this.timeframe.set(tf); this.refresh(); }

  q = signal('');
  owner = signal<'All'|string>('All');
  pipe  = signal<'All'|string>('All');
  status = signal<'All'|LeadStatus>('All');

  owners = signal<( 'All'|string)[]>(['All','Riley Singh','Alice','Ben']);
  pipelines = signal<( 'All'|string)[]>(['All','Golf Carts','Sheds','Cabins','Furniture']);
  statuses: (LeadStatus|'All')[] = ['All','New','Working','Qualified','Quoted','Won','Lost'];

  // ---- Data (deterministic) ----
  private tick = signal(0);
  private all = signal<Lead[]>([]);
  refresh(){ this.tick.update(v=>v+1); this.gen(); }

  constructor(){ this.gen(); }

  private rng(key: string){ return makeSeed(`${this.storeId()}|${this.timeframe()}|LEADS|${key}|${this.tick()}`); }

  private gen(){
    const r = this.rng('SEED');
    const owners = ['Riley Singh','Alice','Ben'];
    const pipes: Lead['pipeline'][] = ['Golf Carts','Sheds','Cabins','Furniture'];
    const sources: Lead['source'][] = ['Web','Walk-in','Phone','Event','Referral'];

    const len = 12 + Math.floor(r()*38); // 12–50
    const month = new Date().getMonth();
    const season = seasonalityFactor(month, [1,1,1,1,1,1,1,1,1,1,1,1]);
    const scale = tfScale(this.timeframe());

    const baseByPipe: Record<string,number[]> = {
      'Golf Carts':[7500, 9800, 11500, 12900],
      'Sheds':[3200, 4800, 6200, 7800],
      'Cabins':[18000, 24000, 32000, 42000],
      'Furniture':[600, 900, 1400, 2200]
    };

    const people = ['Carter','Young','Henderson','Gonzalez','Patel','Nguyen','Lee','Baker','Santiago','Martin','Ward','Diaz','Price','Klein','Thompson'];
    const titles = ['Inquiry','Website Form','Call Back','Showroom Visit','Requested Quote','Looking for Options','Financing Question'];

    const stageAt = (i:number): LeadStatus => {
      const x = i/len;
      if (x < 0.35) return 'New';
      if (x < 0.60) return 'Working';
      if (x < 0.78) return 'Qualified';
      if (x < 0.90) return 'Quoted';
      if (x < 0.95) return 'Won';
      return 'Lost';
    };

    const pick = <T,>(arr:T[]) => arr[Math.floor(r()*arr.length)]!;
    const wobble = () => 0.9 + r()*0.25;

    const rows: Lead[] = Array.from({length:len}, (_,i) => {
      const pipeline = pick(pipes);
      const baseArr = baseByPipe[pipeline]!;
      const base = pick(baseArr);
      const value = Math.round(base * wobble() * season * scale);
      const name = pick(people);
      const id = `L-${this.storeId()}-${this.timeframe()}-${this.tick()}-${i}`;
      const phone = r() > 0.18 ? `330-555-${String(1000+Math.floor(r()*9000))}` : undefined;
      const email = r() > 0.18 ? `customer${100+i}@example.com` : undefined;
      return {
        id,
        name,
        title: pick(titles),
        pipeline,
        status: stageAt(i),
        owner: r() > 0.25 ? pick(owners) : undefined,
        value,
        phone, email,
        age: 1 + Math.floor(r()*21),
        source: pick(sources),
      };
    });

    // Simple deterministic duplicate flags by normalized email/phone
    const byKey = new Map<string,string>();
    for (const row of rows) {
      const key = (row.email?.toLowerCase() || '') + '|' + (row.phone?.replace(/\D/g,'') || '');
      if (key.trim() && byKey.has(key)) {
        row.duplicateOf = byKey.get(key)!;
      } else if (key.trim()) {
        byKey.set(key, row.id);
      }
    }

    this.all.set(rows);
  }

  // ---- Table model ----
  displayed = signal<string[]>(['select','name','pipeline','status','owner','value','age','contact','source','actions']);
  selection = signal<Set<string>>(new Set());

  filtered = computed(() => {
    const text = this.q().toLowerCase().trim();
    const owner = this.owner();
    const pipe  = this.pipe();
    const st    = this.status();
    return this.all().filter(l => {
      if (owner !== 'All' && l.owner !== owner) return false;
      if (pipe !== 'All' && l.pipeline !== pipe) return false;
      if (st !== 'All' && l.status !== st) return false;
      if (!text) return true;
      const blob = `${l.name} ${l.title} ${l.pipeline} ${l.owner ?? ''} ${l.status} ${l.value ?? ''} ${l.email ?? ''} ${l.phone ?? ''}`.toLowerCase();
      return blob.includes(text);
    });
  });

  // KPIs
  kpiNew = computed(() => this.filtered().filter(l => l.status === 'New').length);
  kpiUnassigned = computed(() => this.filtered().filter(l => !l.owner).length);
  kpiContactable = computed(() => this.filtered().filter(l => l.phone || l.email).length);
  kpiAged = computed(() => this.filtered().filter(l => l.age >= 7).length);
  kpiDupes = computed(() => this.filtered().filter(l => !!l.duplicateOf).length);

  // ---- Actions ----
  toggleRow(id: string){
    const s = new Set(this.selection());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selection.set(s);
  }
  toggleAll(checked: boolean){
    this.selection.set(checked ? new Set(this.filtered().map(l=>l.id)) : new Set());
  }
  isAllSelected(){ return this.selection().size && this.selection().size === this.filtered().length; }

  assignSelected(owner: string){
    if (!owner) return;
    const ids = this.selection();
    const rows = this.all().map(l => ids.has(l.id) ? { ...l, owner } : l);
    this.all.set(rows); this.snack.open(`Assigned ${ids.size} lead(s) to ${owner}`, 'OK', { duration: 1200 });
    this.selection.set(new Set());
  }

  setStatus(ids: Set<string>, next: LeadStatus){
    const rows = this.all().map(l => ids.has(l.id) ? { ...l, status: next } : l);
    this.all.set(rows);
    this.snack.open(`Updated ${ids.size} lead(s) → ${next}`, 'OK', { duration: 1200 });
    this.selection.set(new Set());
  }

  call(l: Lead){ l.phone ? this.comms.call(l.phone) : this.snack.open('No phone', 'OK', { duration: 900 }); }
  sms(l: Lead){ l.phone ? this.comms.sms(l.phone) : this.snack.open('No phone', 'OK', { duration: 900 }); }
  email(l: Lead){ l.email ? this.comms.email(l.email, `Regarding ${l.title}`, '') : this.snack.open('No email', 'OK', { duration: 900 }); }

  open(l: Lead){
    const numericId = Number(l.id.replace(/\D+/g,'').slice(-4)) || Math.floor(Math.random()*9000)+1000;
    this.dialog.open(SalesCardComponent, {
      width: '760px',
      data: <SalesCardData>{
        id: numericId,
        customer: l.name,
        title: l.title,
        pipeline: l.pipeline as any,
        stage: l.status === 'New' ? 'Lead' :
               l.status === 'Working' ? 'Qualified' :
               l.status === 'Qualified' ? 'Qualified' :
               l.status === 'Quoted' ? 'Quoted' :
               l.status === 'Won' ? 'Won' : 'Lost',
        value: l.value ?? 0,
        owner: l.owner ?? 'Unassigned',
        age: l.age,
      },
      panelClass: 'hog-light-dialog',
      autoFocus: false,
    }).afterClosed().subscribe();
  }

  // ---- Import CSV (simple header-flexible parser) ----
  importCsv(file: File){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const text = String(reader.result ?? '');
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (!lines.length) return;
        const header = lines.shift()!.split(',').map(h => h.trim().toLowerCase());
        const idx = (k: string) => header.findIndex(h => h.includes(k));
        const rows: Lead[] = [];
        const r = this.rng('IMPORT');
        for (const line of lines){
          const cells = line.split(',');
          const name = cells[idx('name')] ?? cells[idx('customer')] ?? `Imported ${Math.floor(r()*1000)}`;
          const phone = cells[idx('phone')]?.replace(/[^\d+]/g,'') || undefined;
          const email = cells[idx('email')] || undefined;
          const pipeline = (cells[idx('pipeline')] as Lead['pipeline']) || 'Golf Carts';
          const value = Number(cells[idx('value')] ?? '') || undefined;
          const title = cells[idx('title')] || 'Imported Lead';
          const source = (cells[idx('source')] as Lead['source']) || 'Import';
          const id = `L-${this.storeId()}-${this.timeframe()}-${this.tick()}-IMP-${rows.length}`;
          rows.push({
            id, name, title, pipeline, status: 'New', owner: undefined, value, phone, email,
            age: 0, source,
          });
        }
        // merge + dedupe (email+phone key)
        const merged = [...this.all(), ...rows];
        const seen = new Map<string,string>();
        for (const l of merged){
          const key = (l.email?.toLowerCase() || '') + '|' + (l.phone?.replace(/\D/g,'') || '');
          if (key.trim()){
            if (seen.has(key)) l.duplicateOf = seen.get(key)!; else seen.set(key, l.id);
          }
        }
        this.all.set(merged);
        this.snack.open(`Imported ${rows.length} lead(s)`, 'OK', { duration: 1400 });
      } catch(e){
        console.error(e);
        this.snack.open('Import failed', 'Dismiss', { duration: 2000 });
      }
    };
    reader.readAsText(file);
  }
  // Add below your existing fields/signals:

  // Owners list without "All" for templates that disallow *ngIf on mat-option
  ownersNoAll = computed(() => this.owners().filter(o => o !== 'All') as string[]);

  // Handle file input change safely (no nullable template errors)
  onFileChange(input: HTMLInputElement) {
    const file = input.files && input.files[0];
    if (file) this.importCsv(file);
    input.value = ''; // reset
  }

  // Template-friendly wrapper for single-row status change
  setRowStatus(l: Lead, next: LeadStatus) {
    this.setStatus(new Set([l.id]), next);
  }

}
