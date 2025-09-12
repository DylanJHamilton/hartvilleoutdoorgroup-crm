import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { ExportDialog } from '../dialog/export.dialog';

type Timeframe = 'DTD'|'WTD'|'MTD'|'QTD'|'YTD'|'CUSTOM';
type RowType = 'Activity' | 'Order' | 'Quote';

export interface DateRange { start: Date; end: Date; }

interface SelfRow {
  id: string;
  type: RowType;
  owner: string;
  subject: string;
  date: string;   // ISO or pretty
  value?: number; // for Orders/Quotes
}

@Component({
  standalone: true,
  selector: 'hog-self-reports',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  styleUrls: ['./self-reports.scss'],
  templateUrl: './self-reports.html',
})
export class SelfReportsComponent {
  private dialog = inject(MatDialog);

  // Inputs from parent
  @Input({ required: true }) storeId!: string;
  @Input({ required: true }) timeframe!: Timeframe;
  @Input() range: DateRange | null = null;
  @Input() scopeUserId?: string;           // if provided, restrict to this owner (rep view)

  // Filters
  readonly type = signal<RowType | 'All'>('All');
  readonly owner = signal<string | 'ALL'>(this.scopeUserId ?? 'ALL');

  // Table
  readonly displayedColumns = ['select','type','owner','subject','date','value'];
  readonly selection = new SelectionModel<SelfRow>(true, []);

  // Data
  readonly allRows = computed<SelfRow[]>(() => this.generateRows());
  readonly rows = computed(() => {
    const t = this.type();
    const o = this.owner();
    return this.allRows().filter(r => (t==='All' || r.type===t) && (o==='ALL' || r.owner===o));
  });

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.rows().length;
    return numSelected === numRows;
  }
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.rows().forEach(row => this.selection.select(row));
  }

  export() {
    const rows = this.selection.selected.length ? this.selection.selected : this.rows();
    const cols = ['id','type','owner','subject','date','value'];
    this.dialog.open(ExportDialog, {
      width: '420px',
      data: { filename: `self-reports-${this.storeId}-${this.timeframe}`, rows, columns: cols }
    });
  }

  // Deterministic row generator (no external libs)
  private generateRows(): SelfRow[] {
    const ownerPool = this.scopeUserId ? [this.scopeUserId] : ['rep-001','rep-002','rep-003'];
    const seedKey = ['self', this.storeId, ownerPool.join('.'), this.timeframe, this.range?.start?.toISOString() ?? '', this.range?.end?.toISOString() ?? ''].join('|');
    const rnd = this.seeded(seedKey);

    const count = 24 + Math.floor(rnd()*16); // 24..40
    const rows: SelfRow[] = [];
    for (let i=0; i<count; i++) {
      const type: RowType = (['Activity','Order','Quote'] as RowType[])[Math.floor(rnd()*3)];
      const owner = ownerPool[Math.floor(rnd()*ownerPool.length)];
      const subject = this.subjectFor(type, rnd);
      const day = 1 + Math.floor(rnd()*27);
      const date = new Date(); date.setDate(day);
      const value = type==='Order' || type==='Quote' ? (800 + Math.floor(rnd()*4800)) : undefined;
      rows.push({
        id: `${type.slice(0,1)}-${i+1}`,
        type, owner, subject,
        date: date.toLocaleDateString(),
        value
      });
    }
    return rows;
  }

  private subjectFor(t: RowType, rnd: () => number) {
    if (t==='Activity') {
      const verbs = ['Follow-up','Intro Call','Quote Review','Onboarding','Demo'];
      return `${verbs[Math.floor(rnd()*verbs.length)]}`;
    }
    const items = ['Shed','Garage','Playset','Cabin','Cart'];
    return `${t} • ${items[Math.floor(rnd()*items.length)]}`;
  }

  private seeded(seedStr: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => {
      h += 0x6D2B79F5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
