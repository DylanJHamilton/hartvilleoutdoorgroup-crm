import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

import type { Customer } from '../../../../types/customer.types';
import { mockStores } from '../../../../mock/locations.mock';
import { mockUsers } from '../../../../mock/users.mock';

export type CustomerViewData = { customer: Customer };

@Component({
  standalone: true,
  selector: 'hog-customer-view-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatIconModule,
  ],
  template: `
  <h2 mat-dialog-title>Customer Details</h2>

  <div mat-dialog-content class="wrap">
    <!-- Header -->
    <div class="head">
      <div class="name">{{ c.name }}</div>
      <div class="sub">{{ c.email || '—' }} <span class="dot">•</span> {{ c.phone || '—' }}</div>
    </div>

    <!-- Meta chips -->
    <div class="chips">
      <mat-chip class="chip" *ngIf="storeName"><mat-icon>store</mat-icon>{{ storeName }}</mat-chip>
      <mat-chip class="chip" *ngIf="ownerName"><mat-icon>badge</mat-icon>{{ ownerName }}</mat-chip>
      <mat-chip class="chip" *ngIf="c.value != null"><mat-icon>paid</mat-icon>{{ c.value | currency }}</mat-chip>
    </div>

    <mat-divider class="sep"></mat-divider>

    <!-- Details grid -->
    <div class="grid">
      <div class="item">
        <div class="label">Desired Product</div>
        <div class="value">{{ c.desiredProduct || '—' }}</div>
      </div>

      <div class="item">
        <div class="label">Additional Details</div>
        <div class="value pre">{{ c.additionalDetails || '—' }}</div>
      </div>

      <div class="item">
        <div class="label">Support Notes (latest)</div>
        <div class="value pre">{{ c.supportNotes || '—' }}</div>
      </div>

      <div class="item two">
        <div class="label">Appointments ({{ c.appointments?.length || 0 }})</div>
        <mat-list *ngIf="c.appointments?.length; else noAppt">
          <mat-list-item *ngFor="let a of c.appointments">
            <mat-icon matListItemIcon>event</mat-icon>
            <div matListItemTitle>{{ a.title || 'Appointment' }}</div>
            <div matListItemLine>
              <span>{{ a.startsAt | date:'medium' }}</span>
              <span *ngIf="a.endsAt">&nbsp;→&nbsp;{{ a.endsAt | date:'medium' }}</span>
            </div>
            <div matListItemLine *ngIf="a.note" class="pre small">{{ a.note }}</div>
          </mat-list-item>
        </mat-list>
        <ng-template #noAppt><div class="value">—</div></ng-template>
      </div>
    </div>

    <mat-divider class="sep"></mat-divider>

    <div class="meta small">
      <div>Created: {{ c.createdAt | date:'medium' }}</div>
      <div>Updated: {{ c.updatedAt | date:'medium' }}</div>
    </div>
  </div>

  <div mat-dialog-actions align="end">
    <button mat-flat-button color="primary" (click)="close()">Close</button>
  </div>
  `,
  styles: [`
    .wrap { min-width: 560px; max-width: 720px; }
    .head .name { font-size: 20px; font-weight: 700; }
    .head .sub { opacity:.8; }
    .dot { padding: 0 6px; opacity:.5; }
    .chips { display:flex; flex-wrap:wrap; gap:8px; margin: 12px 0 8px; }
    .chip mat-icon { font-size: 18px; margin-right:6px; }
    .sep { margin: 12px 0; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
    .item.two { grid-column: 1 / -1; }
    .label { font-size:12px; text-transform:uppercase; letter-spacing:.04em; opacity:.7; margin-bottom:4px; }
    .value { white-space:pre-wrap; }
    .pre { white-space:pre-wrap; }
    .small { font-size:12px; opacity:.8; }
    @media (max-width: 640px) { .wrap { min-width: 0; } .grid { grid-template-columns: 1fr; } }
  `]
})
export class CustomerViewDialog {
  private ref = inject(MatDialogRef<CustomerViewDialog>);
  data = inject<CustomerViewData>(MAT_DIALOG_DATA);

  c = this.data.customer;

  storeName = ((): string => {
    const s = mockStores.find(x => x.id === this.c.storeLocationId);
    return s?.name ?? 'Unknown Store';
  })();

  ownerName = ((): string => {
    if (!this.c.salesOwnerUserId) return 'Unassigned';
    const u = mockUsers.find(x => x.id === this.c.salesOwnerUserId);
    return u?.name ?? 'Unknown Owner';
  })();

  close(): void { this.ref.close(); }
}
