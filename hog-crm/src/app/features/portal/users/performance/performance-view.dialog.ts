import { Component, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import type { Performance } from '../../../../types/performance.types';
import { PerformanceService } from './performance.service';
import { mockUsers } from '../../../../mock/users.mock';
import { PerformanceMetricsComponent } from './performance-metrics.component';

export type PerformanceViewData = { userId: string; name?: string };

@Component({
  standalone: true,
  selector: 'hog-performance-view-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatDividerModule, MatIconModule, PerformanceMetricsComponent],
  template: `
  <h2 mat-dialog-title>Performance — {{ displayName }}</h2>

  <div mat-dialog-content class="wrap">
    <ng-container *ngIf="records().length; else empty">
      <hog-performance-metrics *ngFor="let rec of records()" [record]="rec"></hog-performance-metrics>
    </ng-container>

    <ng-template #empty>
      <div class="empty">
        <mat-icon>info</mat-icon>
        <div>No performance records found for this employee.</div>
      </div>
    </ng-template>
  </div>

  <div mat-dialog-actions align="end">
    <button mat-flat-button color="primary" (click)="close()">Close</button>
  </div>
  `,
  styles: [`
    .wrap { min-width: 580px; max-width: 820px; display:flex; flex-direction:column; gap:12px; }
    .empty { display:flex; align-items:center; gap:8px; opacity:.8; padding:16px; }
    @media (max-width: 640px) { .wrap { min-width: 0; } }
  `]
})
export class PerformanceViewDialog {
  private ref = inject(MatDialogRef<PerformanceViewDialog>);
  private data = inject<PerformanceViewData>(MAT_DIALOG_DATA);
  private svc = inject(PerformanceService);

  displayName = this.data.name ?? (mockUsers.find(u => u.id === this.data.userId)?.name ?? 'Employee');
  records: WritableSignal<Performance[]> = signal<Performance[]>(this.svc.byUser(this.data.userId));

  close() { this.ref.close(); }
}
