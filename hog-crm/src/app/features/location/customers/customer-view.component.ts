import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Customer, Dept } from './services/customer.service';

@Component({
  standalone: true,
  selector: 'hog-customer-view',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatTooltipModule],
  styles: [`
    :host { --hog-primary:#1d4ed8; --hog-ink:#0f172a; --card:#fff; --muted:#64748b; --chip:#e2e8f0; }
    .hog-view-panel .mat-mdc-dialog-surface { background:#fff !important; color:var(--hog-ink); }

    .card {
      background: var(--card);
      border-radius: 12px;
      border: 1px solid rgba(2,6,23,.08);
      padding: 16px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px 16px;
    }
    .title { font-size: 20px; font-weight: 600; display:flex; align-items:center; gap:10px; }
    .muted { color: var(--muted); font-size: 12px; }
    .row { display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top: 10px; }
    .kv { display:flex; flex-direction:column; }
    .kv label { font-size:12px; color:var(--muted); }
    .kv div { font-size:14px; color:var(--hog-ink); }

    .chip { background:var(--chip); border:1px solid rgba(2,6,23,.08); padding:2px 8px; border-radius:12px; font-size:12px; }

    .actions { display:flex; gap:8px; align-items:center; justify-content:flex-end; }
    .section { margin-top: 16px; }
    .notes-box { background:#fff; border:1px solid rgba(2,6,23,.08); border-radius:8px; padding:10px; min-height:68px; white-space:pre-wrap; }
  `],
  template: `
    <div class="card">
      <div class="title">
        <mat-icon>person</mat-icon>
        {{ data.name }}
        <span class="chip" matTooltip="Assigned Department">{{ data.assignedDept || 'SALES' }}</span>
      </div>
      <div class="actions">
        <button mat-stroked-button color="primary" (click)="close()">Close</button>
      </div>

      <div class="row">
        <div class="kv"><label>Email</label><div>{{ data.email || '—' }}</div></div>
        <div class="kv"><label>Phone</label><div>{{ data.phone || '—' }}</div></div>
        <div class="kv"><label>Interested Product</label><div>{{ data.interestedProduct || '—' }}</div></div>
        <div class="kv"><label>Pipeline / Stage</label><div>{{ data.pipeline || '—' }} • {{ data.stage || '—' }}</div></div>
        <div class="kv"><label>Owner</label><div>{{ data.owner || '—' }}</div></div>
        <div class="kv"><label>Created</label><div>{{ data.createdAt | date:'MMM d, y, h:mm a' }}</div></div>
      </div>

      <div class="section">
        <label class="muted">Notes</label>
        <div class="notes-box">{{ data.notes || '—' }}</div>
      </div>

      <div class="section" style="display:flex; gap:8px;">
        <button mat-stroked-button color="primary" matTooltip="Support"><mat-icon>support_agent</mat-icon>&nbsp;Support</button>
        <button mat-stroked-button color="primary" matTooltip="Service"><mat-icon>build</mat-icon>&nbsp;Service</button>
        <button mat-stroked-button color="primary" matTooltip="Delivery"><mat-icon>local_shipping</mat-icon>&nbsp;Delivery</button>
      </div>
    </div>
  `
})
export class CustomerViewComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Customer,
    private ref: MatDialogRef<CustomerViewComponent>,
  ) {}
  close() { this.ref.close(); }
}
