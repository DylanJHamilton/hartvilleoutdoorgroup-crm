import { Component, ViewChild, ElementRef, inject, computed, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CustomersService, Customer, Pipeline, Stage, Dept } from '../services/customer.service';
import { CustomerConversationsService, Channel } from '../services/customer-conversations.service';
import { CustomerDialogComponent } from '../dialog/customer.dialog';

type ListItem = {
  customer: Customer;
  lastAt: number;      // ms
  lastText: string;
  lastChannel?: Channel;
};

@Component({
  standalone: true,
  selector: 'hog-customers-conversations',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatListModule, MatCardModule, MatDividerModule, MatDialogModule, MatTooltipModule
  ],
  styles: [`
    :host { --ink:#0f172a; --muted:#64748b; --primary:#1d4ed8; display:block; color:var(--ink); }
    .page { max-width: 1280px; margin: 8px auto 24px; padding: 0 12px; }
    .head { display:flex; align-items:center; gap:12px; margin: 4px 0 12px; }
    .title { font-size: 22px; font-weight: 700; }
    .spacer { flex:1 1 auto; }

    .grid { display:grid; grid-template-columns: 320px minmax(360px, 1fr) 320px; gap:12px; }
    @media (max-width: 1200px) { .grid { grid-template-columns: 280px 1fr 300px; } }
    @media (max-width: 980px)  { .grid { grid-template-columns: 1fr; } }

    /* LEFT: inbox list */
    .filters { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
    .filters mat-form-field { flex: 1 1 50%; min-width: 160px; }
    .inbox { border:1px solid rgba(2,6,23,.08); border-radius:12px; background:#fff; overflow:hidden; }
    .inbox .list-empty { color: var(--muted); padding: 12px; }

    .row { display:flex; gap:10px; padding:10px 12px; cursor:pointer; border-bottom:1px solid rgba(2,6,23,.06); }
    .row:hover { background:#f8fafc; }
    .row.active { background:#eef2ff; }
    .avatar { width:36px; height:36px; border-radius:50%; background:#e2e8f0; display:flex; align-items:center; justify-content:center; font-weight:700; }
    .meta { display:flex; gap:8px; align-items:center; font-size:12px; color:var(--muted); }
    .snippet { font-size:13px; color:#111827; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    /* CENTER: thread */
    .thread-card { display:flex; flex-direction:column; height: 70vh; min-height: 520px; }
    .thread { flex:1 1 auto; overflow:auto; padding: 12px; background:#fff; border:1px solid rgba(2,6,23,.08); border-radius:12px; }
    .bubble-row { display:flex; margin:8px 0; }
    .bubble { max-width: 70%; background:#f8fafc; border:1px solid rgba(2,6,23,.08); padding:10px 12px; border-radius:12px; white-space:pre-wrap; }
    .out { justify-content:flex-end; }
    .out .bubble { background:#eef2ff; border-color:#c7d2fe; }
    .meta2 { font-size:11px; color:var(--muted); margin-top:4px; }

    .composer { display:grid; grid-template-columns: 140px 1fr 120px; gap:8px; margin-top:8px; }
    @media (max-width: 720px) { .composer { grid-template-columns: 1fr; } }

    /* RIGHT: profile panel */
    .card { border:1px solid rgba(2,6,23,.08); border-radius:12px; background:#fff; }
    .kv { display:flex; flex-direction:column; margin-bottom:8px; }
    .kv label { font-size:12px; color:var(--muted); }
    .badge {
      display:inline-flex; align-items:center; gap:6px;
      padding:2px 8px; border-radius:12px; background:#e2e8f0; color:var(--ink); font-size:12px;
      border:1px solid rgba(2,6,23,.08);
    }
    .dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
    .sales{background:#3b82f6}.support{background:#10b981}.service{background:#f59e0b}.delivery{background:#ef4444}
  `],
  template: `
    <div class="page">
      <div class="head">
        <div class="title">Customers — Conversations</div>
        <span class="spacer"></span>
        <button mat-stroked-button color="primary" [routerLink]="['../']"><mat-icon>list</mat-icon>&nbsp;Open List</button>
        <button mat-stroked-button color="primary" [routerLink]="['../dashboard']"><mat-icon>insights</mat-icon>&nbsp;Customers Dashboard</button>
      </div>

      <div class="grid">
        <!-- LEFT: Inbox -->
        <div>
          <div class="filters">
            <mat-form-field appearance="outline" color="primary" floatLabel="always">
              <mat-label>Search</mat-label>
              <input matInput [formControl]="filters.controls.q" placeholder="Name, email, phone">
            </mat-form-field>
            <mat-form-field appearance="outline" color="primary" floatLabel="always">
              <mat-label>Channel</mat-label>
              <mat-select [formControl]="filters.controls.channel">
                <mat-option value="">All</mat-option>
                <mat-option value="note">Note</mat-option>
                <mat-option value="call">Call</mat-option>
                <mat-option value="sms">SMS</mat-option>
                <mat-option value="email">Email</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="inbox">
            <ng-container *ngIf="list().length; else emptyList">
              <div *ngFor="let it of list()" class="row" [class.active]="it.customer.id===selectedId()" (click)="select(it.customer)">
                <div class="avatar">{{ initials(it.customer.name) }}</div>
                <div style="flex:1 1 auto; min-width:0;">
                  <div style="display:flex;gap:8px;align-items:center;">
                    <div style="font-weight:700;">{{ it.customer.name }}</div>
                    <div class="meta">
                      <span *ngIf="it.lastChannel as ch">{{ ch | titlecase }}</span>
                      <span>•</span>
                      <span>{{ it.lastAt | date:'MMM d, h:mm a' }}</span>
                    </div>
                  </div>
                  <div class="snippet">{{ it.lastText || '—' }}</div>
                </div>
              </div>
            </ng-container>
            <ng-template #emptyList><div class="list-empty">No conversations yet. Start one on the right →</div></ng-template>
          </div>
        </div>

        <!-- CENTER: Thread -->
        <div>
          <mat-card class="thread-card">
            <mat-card-header>
              <mat-card-title>{{ sel()?.name || 'Select a customer' }}</mat-card-title>
              <mat-card-subtitle *ngIf="sel()">{{ sel()?.email || '—' }} &nbsp;•&nbsp; {{ sel()?.phone || '—' }}</mat-card-subtitle>
            </mat-card-header>

            <mat-card-content class="thread" #threadEl>
              <ng-container *ngIf="sel(); else pickOne">
                <div *ngFor="let m of msgs()" class="bubble-row" [class.out]="m.direction==='out'">
                  <div class="bubble">
                    <div>{{ m.text }}</div>
                    <div class="meta2">{{ m.channel | titlecase }} • {{ m.direction==='in' ? 'From customer' : 'To customer' }} • {{ m.atISO | date:'MMM d, y, h:mm a' }}</div>
                  </div>
                </div>
              </ng-container>
              <ng-template #pickOne>
                <div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);">
                  Pick a conversation from the left.
                </div>
              </ng-template>
            </mat-card-content>

            <mat-card-actions>
              <form [formGroup]="composer" class="composer" (ngSubmit)="send()">
                <mat-form-field appearance="outline" color="primary" floatLabel="always">
                  <mat-label>Channel</mat-label>
                  <mat-select formControlName="channel">
                    <mat-option value="note">Note</mat-option>
                    <mat-option value="call">Call</mat-option>
                    <mat-option value="sms">SMS</mat-option>
                    <mat-option value="email">Email</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" color="primary" floatLabel="always">
                  <mat-label>Write a message</mat-label>
                  <textarea matInput rows="3" formControlName="text" placeholder="Type here..." [disabled]="!sel()"></textarea>
                </mat-form-field>

                <button mat-flat-button color="primary" type="submit" [disabled]="composer.invalid || !sel()">Send</button>
              </form>
            </mat-card-actions>
          </mat-card>
        </div>

        <!-- RIGHT: Profile -->
        <div class="card" *ngIf="sel()">
          <div style="padding:12px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
              <div class="avatar" style="width:44px;height:44px;font-size:18px;">{{ initials(sel()!.name) }}</div>
              <div>
                <div style="font-weight:700;">{{ sel()!.name }}</div>
                <div style="font-size:12px;color:var(--muted)">{{ sel()!.email || '—' }}</div>
              </div>
              <span class="spacer"></span>
              <button mat-stroked-button color="primary" (click)="edit()"><mat-icon>edit</mat-icon>&nbsp;Edit</button>
            </div>

            <div class="kv"><label>Phone</label><div>{{ sel()!.phone || '—' }}</div></div>
            <div class="kv"><label>Interested</label><div>{{ sel()!.interestedProduct || '—' }}</div></div>
            <div class="kv"><label>Pipeline / Stage</label><div>{{ sel()!.pipeline || '—' }} • {{ sel()!.stage || '—' }}</div></div>
            <div class="kv"><label>Owner</label><div>{{ sel()!.owner || '—' }}</div></div>

            <div style="margin:8px 0;">
              <span class="badge">
                <span class="dot" [ngClass]="{
                  'sales': (sel()!.assignedDept || 'SALES')==='SALES',
                  'support': sel()!.assignedDept==='SUPPORT',
                  'service': sel()!.assignedDept==='SERVICE',
                  'delivery': sel()!.assignedDept==='DELIVERY'
                }"></span>
                {{ sel()!.assignedDept || 'SALES' }}
              </span>
            </div>

            <mat-divider style="margin:10px 0"></mat-divider>
            <div class="kv"><label>Notes (latest)</label><div style="white-space:pre-wrap">{{ sel()!.notes || '—' }}</div></div>

            <div style="display:flex;gap:8px;margin-top:10px;">
              <button mat-stroked-button color="primary" [routerLink]="['../', sel()!.id]"><mat-icon>open_in_new</mat-icon>&nbsp;Open Profile</button>
              <button mat-button [routerLink]="['../']"><mat-icon>list</mat-icon>&nbsp;Go to List</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomersConversationsPage {
  private svc = inject(CustomersService);
  private convo = inject(CustomerConversationsService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // Filters (left)
  filters = this.fb.group({
    q: [''],
    channel: [''] as any
  });

  // Selected conversation
  selectedId = signal<string | null>(null);
  @ViewChild('threadEl') threadEl!: ElementRef<HTMLDivElement>;

  // All list items computed from customers + last message
  private allItems = computed<ListItem[]>(() => {
    const customers = this.svc.items();
    return customers.map(c => {
      const msgs = this.convo.messages(c.id);
      const last = msgs[msgs.length - 1];
      const lastAt = last ? +new Date(last.atISO) : +c.createdAt;
      const lastText = last?.text || c.notes || '';
      return { customer: c, lastAt, lastText, lastChannel: last?.channel };
    }).sort((a,b) => b.lastAt - a.lastAt);
  });

  list = computed(() => {
    const q = (this.filters.controls.q.value || '').toLowerCase();
    const ch = this.filters.controls.channel.value as ''|Channel;
    return this.allItems().filter(it => {
      const matchQ = !q || [it.customer.name, it.customer.email, it.customer.phone].filter(Boolean)
        .some(v => (v as string).toLowerCase().includes(q));
      const matchCh = !ch || it.lastChannel === ch;
      return matchQ && matchCh;
    });
  });

  // Selected customer + messages
  sel = computed<Customer | null>(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.svc.byId(id) ?? null;
  });

  msgs = computed(() => {
    const c = this.sel();
    return c ? this.convo.messages(c.id) : [];
  });

  composer = this.fb.group({
    channel: ['note' as Channel, Validators.required],
    text: ['', Validators.required],
  });

  ngOnInit() {
    // seed selection from ?customerId, else first in list
    const initial = this.route.snapshot.queryParamMap.get('customerId');
    const choose = () => {
      const fromQ = initial && this.svc.byId(initial) ? initial : null;
      const first = this.list()[0]?.customer.id ?? null;
      this.selectedId.set(fromQ || first);
    };
    choose();

    // When filters change, keep a valid selection
    this.filters.valueChanges.subscribe(() => {
      const cur = this.selectedId();
      if (!cur || !this.list().some(it => it.customer.id === cur)) {
        const first = this.list()[0]?.customer.id ?? null;
        this.selectedId.set(first);
      }
    });
  }

  select(c: Customer) {
    this.selectedId.set(c.id);
    this.router.navigate([], { relativeTo: this.route, queryParams: { customerId: c.id }, queryParamsHandling: 'merge' });
    queueMicrotask(() => this.scrollToBottom());
  }

  send() {
    const c = this.sel();
    if (!c || this.composer.invalid) return;
    const v = this.composer.getRawValue();
    this.convo.addMessage(c.id, { channel: v.channel!, text: v.text!.trim(), direction: 'out' });
    this.composer.patchValue({ text: '' });
    this.scrollToBottom();
  }

  edit() {
    const c = this.sel();
    if (!c) return;
    this.dialog.open(CustomerDialogComponent, {
      width:'860px', maxWidth:'95vw', maxHeight:'85vh', data: c, panelClass:'hog-dialog-panel', autoFocus:false, restoreFocus:true
    }).afterClosed().subscribe(res => {
      if (!res) return;
      this.svc.update(c.id, res);
    });
  }

  initials(name: string) {
    return (name || '').split(/\s+/).map(p => p[0]).join('').slice(0,2).toUpperCase() || '?';
  }

  private scrollToBottom() {
    try {
      const el = this.threadEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
