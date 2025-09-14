import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

import { SupportTicketsService } from '../../services/support-tickets.service';

@Component({
  standalone: true,
  selector: 'hog-support-ticket-detail-page',
  imports: [CommonModule, RouterModule, MatTabsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
  <div class="px-4 py-4 space-y-4" *ngIf="ticket() as t">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-800">{{ t.subject }}</h1>
        <div class="text-slate-500 text-sm">Status: {{ t.status }} • Priority: {{ t.priority }}</div>
      </div>
      <div class="flex gap-2">
        <a mat-stroked-button [routerLink]="['../../customers', t.customerId]">View Customer</a>
        <button mat-raised-button color="primary" (click)="addNote()"><mat-icon>note_add</mat-icon>&nbsp;Add Note</button>
      </div>
    </header>

    <mat-tab-group>
      <mat-tab label="Overview">
        <div class="p-4 grid gap-3 md:grid-cols-2">
          <mat-form-field class="w-full">
            <mat-label>Subject</mat-label>
            <input matInput [ngModel]="t.subject" (ngModelChange)="saveSubject($event)">
          </mat-form-field>
          <mat-form-field class="w-full">
            <mat-label>Assigned To</mat-label>
            <input matInput [ngModel]="t.assignedTo" (ngModelChange)="store.update(t.id, { assignedTo: $event })">
          </mat-form-field>
          <mat-form-field class="w-full md:col-span-2">
            <mat-label>Description</mat-label>
            <textarea matInput rows="4" [ngModel]="t.description" (ngModelChange)="store.update(t.id, { description: $event })"></textarea>
          </mat-form-field>
        </div>
      </mat-tab>

      <mat-tab label="Activity">
        <div class="p-4 space-y-2">
          <div *ngFor="let a of activities()" class="p-3 rounded-xl bg-white border">
            <div class="text-sm text-slate-500">{{ a.atISO | date:'MMM d, h:mm a' }} — {{ a.kind }}</div>
            <div class="text-slate-800">{{ a.summary }}</div>
          </div>
        </div>
      </mat-tab>

      <mat-tab label="Conversations">
        <div class="p-6 text-slate-600">
          MVP placeholder: embed Customer Conversations here (scoped to ticket or customer thread).
        </div>
      </mat-tab>
    </mat-tab-group>
  </div>
  `
})
export class SupportTicketDetailPage {
  private route = inject(ActivatedRoute);
  readonly store = inject(SupportTicketsService);

  id = signal<string>(this.route.snapshot.paramMap.get('id')!);
  ticket = computed(() => this.store.byId(this.id())!);
  activities = computed(() => this.store.activitiesFor(this.id()));

  saveSubject(v: string){ this.store.update(this.id(), { subject: v }); }
  addNote(){
    const summary = prompt('Add note:');
    if (!summary) return;
    this.store.addActivity(this.id(), { kind: 'note', summary });
  }
}
