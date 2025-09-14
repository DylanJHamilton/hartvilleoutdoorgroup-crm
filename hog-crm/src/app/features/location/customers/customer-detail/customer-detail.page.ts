import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CustomersService, Customer, Dept } from '../services/customer.service';
import { CustomerDialogComponent } from '../dialog/customer.dialog';

import { CustomerActivityService, CustomerActivity } from '../services/customer-activity.service';
import { CustomerAppointmentsService, CustomerAppointment } from '../services/customer-appointments.service';
import { NewNoteDialogComponent } from '../dialog/new-note.dialog';
import { NewApptDialogComponent } from '../dialog/new-appt.dialog';

@Component({
  standalone: true,
  selector: 'hog-customer-detail',
  imports: [
    CommonModule, RouterLink,
    MatTabsModule, MatCardModule, MatChipsModule, MatIconModule, MatButtonModule,
    MatDividerModule, MatListModule, MatDialogModule, MatSnackBarModule, MatTooltipModule
  ],
  styles: [`
    :host { display:block; --ink:#0f172a; --muted:#64748b; --primary:#1d4ed8; }
    .page { max-width: 1080px; margin: 8px auto 24px; padding: 0 8px; color: var(--ink); }
    .head { display:flex; align-items:center; gap:12px; margin: 4px 0 12px; }
    .title { font-size: 22px; font-weight: 700; }
    .sub { color: var(--muted); font-size: 12px; }
    .spacer { flex:1 1 auto; }

    .badge {
      display:inline-flex; align-items:center; gap:6px;
      padding:2px 8px; border-radius:12px; background:#e2e8f0; color:var(--ink); font-size:12px;
      border:1px solid rgba(2,6,23,.08);
    }
    .dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
    .sales{background:#3b82f6}.support{background:#10b981}.service{background:#f59e0b}.delivery{background:#ef4444}

    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }

    .kv { display:flex; flex-direction:column; }
    .kv label { font-size:12px; color:var(--muted); }
    .kv div   { font-size:14px; }

    .notes { white-space: pre-wrap; border:1px solid rgba(2,6,23,.08); border-radius:8px; padding:10px; background:#fff; }

    .list-empty { color: var(--muted); padding: 12px; }
  `],
  template: `
    <div class="page">
      <div class="head">
        <button mat-button routerLink="../"><mat-icon>arrow_back</mat-icon>Back to Customers</button>
        <span class="spacer"></span>
        <button mat-stroked-button color="primary" (click)="edit()"><mat-icon>edit</mat-icon>&nbsp;Edit</button>
      </div>

      <mat-tab-group color="primary">
        <!-- Overview -->
        <mat-tab label="Overview">
          <mat-card>
            <mat-card-content>
              <div class="head" style="margin:0 0 8px">
                <div class="title">{{ c?.name || 'Customer' }}</div>
                <span class="badge" *ngIf="c">
                  <span class="dot" [ngClass]="{
                    'sales': (c.assignedDept || 'SALES')==='SALES',
                    'support': c.assignedDept==='SUPPORT',
                    'service': c.assignedDept==='SERVICE',
                    'delivery': c.assignedDept==='DELIVERY'
                  }"></span>
                  {{ c.assignedDept || 'SALES' }}
                </span>
                <span class="spacer"></span>
                <span class="sub">Created {{ c?.createdAt | date:'MMM d, y, h:mm a' }}</span>
              </div>

              <div class="grid">
                <div class="kv"><label>Email</label><div>{{ c?.email || '—' }}</div></div>
                <div class="kv"><label>Phone</label><div>{{ c?.phone || '—' }}</div></div>
                <div class="kv"><label>Interested Product</label><div>{{ c?.interestedProduct || '—' }}</div></div>
                <div class="kv"><label>Pipeline / Stage</label><div>{{ c?.pipeline || '—' }} • {{ c?.stage || '—' }}</div></div>
                <div class="kv"><label>Owner</label><div>{{ c?.owner || '—' }}</div></div>
              </div>

              <mat-divider style="margin:12px 0"></mat-divider>

              <label class="sub">Notes</label>
              <div class="notes">{{ c?.notes || '—' }}</div>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- Activity -->
        <mat-tab label="Activity">
          <div class="head">
            <div class="title">Recent Activity</div>
            <span class="spacer"></span>
            <button mat-stroked-button color="primary" (click)="addNote()"><mat-icon>note_add</mat-icon>&nbsp;Add Note</button>
          </div>

          <mat-card>
            <mat-card-content>
              <mat-list *ngIf="activities.length; else emptyAct">
                <mat-list-item *ngFor="let a of activities">
                  <mat-icon matListItemIcon>{{ iconFor(a.kind) }}</mat-icon>
                  <div matListItemTitle>{{ a.summary }}</div>
                  <div matListItemLine class="sub">{{ a.dateISO | date:'MMM d, y, h:mm a' }}</div>
                </mat-list-item>
              </mat-list>
              <ng-template #emptyAct><div class="list-empty">No activity yet.</div></ng-template>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- Appointments -->
        <mat-tab label="Appointments">
          <div class="head">
            <div class="title">Appointments</div>
            <span class="spacer"></span>
            <button mat-stroked-button color="primary" (click)="addAppt()"><mat-icon>event</mat-icon>&nbsp;Add Appointment</button>
          </div>

          <mat-card>
            <mat-card-content>
              <mat-list *ngIf="appts.length; else emptyAppt">
                <mat-list-item *ngFor="let ap of appts">
                  <mat-icon matListItemIcon>event</mat-icon>
                  <div matListItemTitle>{{ ap.title }}</div>
                  <div matListItemLine class="sub">
                    {{ ap.startsAt | date:'MMM d, y, h:mm a' }}
                    <ng-container *ngIf="ap.endsAt">— {{ ap.endsAt | date:'h:mm a' }}</ng-container>
                  </div>
                  <div matListItemLine *ngIf="ap.note">{{ ap.note }}</div>
                </mat-list-item>
              </mat-list>
              <ng-template #emptyAppt><div class="list-empty">No appointments yet.</div></ng-template>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- Files (stub) -->
        <mat-tab label="Files">
          <mat-card><mat-card-content class="list-empty">Coming soon.</mat-card-content></mat-card>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class CustomerDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private svc = inject(CustomersService);
  private actSvc = inject(CustomerActivityService);
  private apptSvc = inject(CustomerAppointmentsService);

  c: Customer | null = null;
  activities: CustomerActivity[] = [];
  appts: CustomerAppointment[] = [];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.c = this.svc.byId(id) ?? null;
    if (!this.c) { this.router.navigate(['../'], { relativeTo: this.route }); return; }
    this.refresh();
  }

  private refresh() {
    const id = this.c!.id;
    this.activities = this.actSvc.activities(id);
    this.appts = this.apptSvc.appointments(id);
  }

  edit() {
    if (!this.c) return;
    this.dialog.open(CustomerDialogComponent, {
      width: '860px',
      maxWidth: '95vw',
      maxHeight: '85vh',
      autoFocus: false,
      restoreFocus: true,
      data: this.c,
      panelClass: 'hog-dialog-panel'
    }).afterClosed().subscribe(res => {
      if (!res) return;
      this.svc.update(this.c!.id, res);
      this.c = this.svc.byId(this.c!.id)!;
      this.snack.open('Customer updated', 'OK', { duration: 1500 });
    });
  }

  addNote() {
    if (!this.c) return;
    this.dialog.open(NewNoteDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      panelClass: 'hog-dialog-panel',
      data: { customerName: this.c.name }
    }).afterClosed().subscribe(text => {
      if (!text) return;
      this.actSvc.add(this.c!.id, { kind: 'note', summary: text });
      this.refresh();
      this.snack.open('Note added', 'OK', { duration: 1200 });
    });
  }

  addAppt() {
    if (!this.c) return;
    this.dialog.open(NewApptDialogComponent, {
      width: '600px', maxWidth: '95vw', panelClass: 'hog-dialog-panel',
      data: { customerName: this.c.name }
    }).afterClosed().subscribe(ap => {
      if (!ap) return;
      this.apptSvc.add(this.c!.id, ap);
      this.refresh();
      this.snack.open('Appointment added', 'OK', { duration: 1200 });
    });
  }

  iconFor(kind: CustomerActivity['kind']) {
    switch (kind) {
      case 'call': return 'call';
      case 'email': return 'mail';
      case 'ticket': return 'confirmation_number';
      case 'order': return 'shopping_cart';
      case 'service': return 'build';
      default: return 'sticky_note_2';
    }
  }
}
