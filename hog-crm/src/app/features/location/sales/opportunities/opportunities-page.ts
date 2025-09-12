import { Component, computed, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SelectionModel } from '@angular/cdk/collections';
import { ActivatedRoute } from '@angular/router';

// hog stat card
import { StatCardComponent as HogStatCard } from '../../../../shared/ui/stat-card/stat-card.component';

// Types
import type { OpportunityStatus } from '../../../../types/sales/prospecting/opportunity.types';
import {
  ProspectOpportunity,
  ProspectList,
} from '../../../../types/sales/prospecting/prospect.types';

// Prospect dialog (add/edit)
import {
  ProspectEditDialog,
  ProspectEditData,
  ProspectEditResult,
} from './dialog/prospect-edit.dialog';

// ---- tiny RNG helper (deterministic demo) ----
type RNG = () => number;
function mulberry32(seed: number): RNG {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Provided at runtime in app, fallback to hash
declare const makeSeed: undefined | ((s: string) => number);

@Component({
  standalone: true,
  selector: 'hog-opportunities-page',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatMenuModule, MatTooltipModule, MatDividerModule,
    MatCardModule, MatListModule, MatDialogModule,
    HogStatCard,
  ],
  templateUrl: './opportunities-page.html',
  styleUrls: ['./opportunities-page.scss'],
})
export class OpportunitiesPage {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // Route context
  readonly storeId = signal<string>(this.route.snapshot.paramMap.get('id') ?? 'default');

  // Options (signals so template uses owners(), pipelines(), statuses())
  readonly owners = signal<string[]>(['Alex Admin','Mia Manager','Sam Sales','Taylor Rep','Jordan Rep']);
  readonly pipelines = signal<string[]>(['Retail','Commercial','Online']);
  readonly statuses = signal<OpportunityStatus[]>(['New','Contacted','Qualified','Nurturing','Closed Won','Closed Lost']);

  // Filters
  readonly filters = this.fb.group({
    timeframe: ['Last 30 days'],
    query: [''],
    owner: [''],
    pipeline: [''],
    status: [''],
  });

  // Data
  readonly all = signal<ProspectOpportunity[]>([]);
  readonly selection = new SelectionModel<ProspectOpportunity>(true, []);
  readonly displayedColumns = ['select','customer','title','pipeline','status','owner','value','ageDays','source','actions'] as const;

  // Prospect Lists
  readonly prospectLists = signal<ProspectList[]>([]);

  // Hidden input for "Import Into list"
  @ViewChild('listImportInput') listImportInput?: ElementRef<HTMLInputElement>;
  private pendingListId: string | null = null;

  constructor() {
    // Seeded demo opportunities
    const tf = (this.filters.value.timeframe ?? 'Last 30 days').replaceAll(' ', '').toLowerCase();
    const seedKey = `${this.storeId()}|${tf}|prospect-opportunities|seed`;
    const seedNum = typeof makeSeed === 'function' ? makeSeed(seedKey) : this.simpleHash(seedKey);
    const rng = mulberry32(seedNum);
    this.all.set(this.makeDemoOpportunities(rng, this.storeId(), 16));

    // Seeded demo prospect lists
    this.prospectLists.set(this.makeDemoLists(rng));
  }

  // Derived
  readonly filtered = computed(() => {
    const f = this.filters.value;
    const q = (f.query ?? '').trim().toLowerCase();
    const owner = (f.owner ?? '').trim();
    const pipeline = (f.pipeline ?? '').trim();
    const status = (f.status ?? '').trim();

    return this.all().filter(o => {
      if (q && !(`${o.customer} ${o.title} ${o.source}`.toLowerCase().includes(q))) return false;
      if (owner && o.owner !== owner) return false;
      if (pipeline && o.pipeline !== pipeline) return false;
      if (status && o.status !== status) return false;
      return true;
    });
  });

  // KPIs
  readonly kpiNew = computed(() => this.all().filter(o => o.status === 'New').length);
  readonly kpiUnassigned = computed(() => this.all().filter(o => !o.owner).length);
  readonly kpiContactable = computed(() => this.all().filter(o => ['New','Contacted','Qualified','Nurturing'].includes(o.status)).length);
  readonly kpiAged = computed(() => this.all().filter(o => o.ageDays >= 14).length);
  readonly kpiDuplicates = computed(() => this.all().filter(o => o.duplicate).length);

  // Bulk actions
  assignSelectedTo(owner: string) {
    const ids = new Set(this.selection.selected.map(s => s.id));
    this.all.update(list => list.map(o => (ids.has(o.id) ? { ...o, owner } : o)));
    this.selection.clear();
  }
  massUpdateStatus(status: OpportunityStatus) {
    const ids = new Set(this.selection.selected.map(s => s.id));
    this.all.update(list => list.map(o => (ids.has(o.id) ? { ...o, status } : o)));
    this.selection.clear();
  }

  toggleAllVisible() {
    const visible = this.filtered();
    const allSelected = visible.every(v => this.selection.isSelected(v));
    if (allSelected) this.selection.deselect(...visible);
    else this.selection.select(...visible);
  }
  isAllVisibleSelected() {
    const visible = this.filtered();
    return visible.length > 0 && visible.every(v => this.selection.isSelected(v));
  }

  // Inline edits (non-draft rows use specific updaters)
  updateOwner(o: ProspectOpportunity, owner: string | null) {
    this.all.update(list => list.map(x => (x.id === o.id ? { ...x, owner: owner || undefined } : x)));
  }
  updateStatus(o: ProspectOpportunity, status: OpportunityStatus) {
    this.all.update(list => list.map(x => (x.id === o.id ? { ...x, status } : x)));
  }

  // Promote to pipeline (stub)
  promoteToPipeline(o: ProspectOpportunity) {
    console.log('[Prospect Opportunities] promoteToPipeline', o.id);
  }

  // ---------- Dialog wiring (Add / Edit) ----------
  openAddDialog() {
    const ref = this.dialog.open<ProspectEditDialog, ProspectEditData, ProspectEditResult>(
      ProspectEditDialog,
      {
        data: {
          mode: 'create',
          owners: this.owners(),
          pipelines: this.pipelines(),
          statuses: this.statuses(),
        },
        width: '680px',
        autoFocus: false,
      }
    );

    ref.afterClosed().subscribe(res => {
      if (!res) return;
      if (res.mode === 'create') {
        this.all.update(a => [res.prospect, ...a]);
      }
    });
  }

  openEditDialog(row: ProspectOpportunity) {
    const ref = this.dialog.open<ProspectEditDialog, ProspectEditData, ProspectEditResult>(
      ProspectEditDialog,
      {
        data: {
          mode: 'edit',
          prospect: row,
          owners: this.owners(),
          pipelines: this.pipelines(),
          statuses: this.statuses(),
        },
        width: '680px',
        autoFocus: false,
      }
    );

    ref.afterClosed().subscribe(res => {
      if (!res) return;
      if (res.mode === 'edit') {
        this.all.update(list => list.map(o => (o.id === res.prospect.id ? res.prospect : o)));
      }
    });
  }
  // ------------------------------------------------

  // Global CSV import (header button)
  onCsvChange(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files && input.files[0];
    if (file) this.importCsv(file);
    if (input) input.value = '';
  }

  // Prospect Lists actions
  newProspectList() {
    const now = new Date();
    const id = `pl_${now.getTime()}`;
    const next: ProspectList = {
      id,
      name: `Imported List ${this.prospectLists().length + 1}`,
      owner: undefined,
      source: 'CSV',
      count: 250,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.prospectLists.update(arr => [next, ...arr]);
  }
  viewProspectList(list: ProspectList) {
    console.log('[Prospect Lists] view', list.id);
    // later: open dialog with details/preview
  }
  // open hidden file input for list import
  triggerListImport(list: ProspectList, inputEl?: HTMLInputElement) {
    this.pendingListId = list.id;
    const el = inputEl ?? this.listImportInput?.nativeElement;
    if (!el) return;
    el.value = ''; // allow reselecting same file
    el.click();
  }
  // handle chosen CSV for specific list
  onListCsvChange(evt: Event) {
    const input = evt.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    const listId = this.pendingListId ?? undefined;
    this.pendingListId = null;
    if (input) input.value = '';

    this.importCsv(file, listId);
  }

  // CSV import (accepts optional listId to associate)
  importCsv(file: File, listId?: string) {
    console.log('[Prospect Opportunities] import CSV', { name: file.name, listId });
    // TODO: real parse/upload. Demo: bump count on target list
    if (listId) {
      this.prospectLists.update(arr =>
        arr.map(l => l.id === listId ? { ...l, count: l.count + 50, updatedAt: new Date().toISOString() } : l)
      );
    }
  }

  // Refresh (deterministic)
  refresh() {
    const tf = (this.filters.value.timeframe ?? 'Last 30 days').replaceAll(' ', '').toLowerCase();
    const seedKey = `${this.storeId()}|${tf}|prospect-opportunities|seed`;
    const seedNum = typeof makeSeed === 'function' ? makeSeed(seedKey) : this.simpleHash(seedKey);
    const rng = mulberry32(seedNum);
    this.all.set(this.makeDemoOpportunities(rng, this.storeId(), 16));
    this.selection.clear();
  }

  // Draft row helpers (kept for parity but no longer used once dialogs are primary)
  private draftIds = new Set<string>();
  startAddDraft() {
    const id = `draft_${Date.now()}`;
    const draft: ProspectOpportunity = {
      id,
      customer: '',
      title: '',
      pipeline: this.pipelines()[0] ?? 'Retail',
      status: 'New' as OpportunityStatus,
      owner: undefined,
      value: 0,
      ageDays: 0,
      source: 'Website',
      duplicate: false,
    };
    this.all.update(a => [draft, ...a]); // insert at top
    this.draftIds.add(id);
  }
  isDraft = (id: string) => this.draftIds.has(id);

  saveDraft(row: ProspectOpportunity) {
    if (!row.customer?.trim() || !row.title?.trim()) return;
    this.draftIds.delete(row.id);
    this.all.update(list =>
      list.map(o => (o.id === row.id ? { ...o, value: Math.max(0, Number(o.value || 0)) } : o))
    );
  }
  cancelDraft(row: ProspectOpportunity) {
    if (!this.draftIds.has(row.id)) return;
    this.all.update(list => list.filter(o => o.id !== row.id));
    this.draftIds.delete(row.id);
  }
  updateDraft<K extends keyof ProspectOpportunity>(row: ProspectOpportunity, key: K, v: ProspectOpportunity[K]) {
    this.all.update(list => list.map(o => (o.id === row.id ? { ...o, [key]: v } : o)));
  }
  addFooterDraft() { this.startAddDraft(); }

  // Demo data
  private makeDemoOpportunities(rng: RNG, storeId: string, count: number): ProspectOpportunity[] {
    const first = ['Chris','Jamie','Morgan','Taylor','Jordan','Alex','Riley','Casey','Avery','Parker','Cameron','Drew'];
    const last = ['Smith','Johnson','Lee','Brown','Davis','Clark','Lewis','Young','Allen','Wright','Hill','Lopez'];
    const titles = ['12x16 Shed','2-Car Garage','Lofted Barn','Cabin Shell','Playset + Install','Poly Shed','Custom Gazebo','Carport'];
    const srcs = ['Website','Walk-in','Phone','Referral','Facebook','Google Ads','Email'];

    const pipelines = this.pipelines();
    const statuses = this.statuses();
    const owners = this.owners();

    const rows: ProspectOpportunity[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < count; i++) {
      const cust = `${first[Math.floor(rng()*first.length)]} ${last[Math.floor(rng()*last.length)]}`;
      const title = titles[Math.floor(rng()*titles.length)];
      const pipeline = pipelines[Math.floor(rng()*pipelines.length)];
      const status = statuses[Math.floor(rng()*statuses.length)];
      const ownerPick = rng() < 0.75 ? owners[Math.floor(rng()*owners.length)] : undefined;
      const value = Math.round((2000 + rng()*18000) / 50) * 50;
      const ageDays = Math.floor(rng()*28);
      const source = srcs[Math.floor(rng()*srcs.length)];
      const key = `${cust}|${title}`.toLowerCase();
      const duplicate = seen.has(key) || rng() < 0.08;
      seen.add(key);

      rows.push({ id: `${storeId}-${i}-${Math.floor(rng()*1e6)}`, customer: cust, title, pipeline, status, owner: ownerPick, value, ageDays, source, duplicate });
    }
    return rows;
  }

  private makeDemoLists(rng: RNG): ProspectList[] {
    const today = new Date();
    const iso = (d: Date) => d.toISOString();
    return [
      { id: 'pl_001', name: 'Home Show Leads – Q3', owner: 'Mia Manager', source: 'Tradeshow', count: 182, createdAt: iso(new Date(today.getTime()-14*864e5)), updatedAt: iso(new Date(today.getTime()-2*864e5)) },
      { id: 'pl_002', name: 'Facebook Interest – Sheds', owner: 'Sam Sales', source: 'Facebook', count: 420, createdAt: iso(new Date(today.getTime()-30*864e5)), updatedAt: iso(new Date(today.getTime()-6*864e5)) },
      { id: 'pl_003', name: 'Website RFQs – August', owner: undefined, source: 'Website', count: 96, createdAt: iso(new Date(today.getTime()-10*864e5)), updatedAt: iso(new Date(today.getTime()-1*864e5)) },
    ];
  }

  private simpleHash(s: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
}
