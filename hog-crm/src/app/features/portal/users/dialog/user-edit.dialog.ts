import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

import { mockUsers } from '../../../../mock/users.mock';
import { mockStores } from '../../../../mock/locations.mock';
import type { Role } from '../../../../types/role.types';
import { PerformanceService } from '../performance/performance.service';

export type EditUserResult = {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  locationIds: string[];
};

type EditData = { email: string };

@Component({
  standalone: true,
  selector: 'hog-user-edit-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule, // <-- needed for <mat-divider>
  ],
  template: `
    <h2 mat-dialog-title>Edit Employee</h2>

    <form [formGroup]="fm" (ngSubmit)="save()" mat-dialog-content class="wrap">
      <!-- Core identity/assignment -->
      <div class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" required />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Roles</mat-label>
          <mat-select formControlName="roles" multiple>
            <mat-option value="OWNER">OWNER</mat-option>
            <mat-option value="ADMIN">ADMIN</mat-option>
            <mat-option value="MANAGER">MANAGER</mat-option>
            <mat-option value="SALES">SALES</mat-option>
            <mat-option value="CUSTOMER_SERVICE">CUSTOMER_SERVICE</mat-option>
            <mat-option value="SERVICE">SERVICE</mat-option>
            <mat-option value="DELIVERY">DELIVERY</mat-option>
            <mat-option value="RENTALS">RENTALS</mat-option>
            <mat-option value="HYBRID">HYBRID</mat-option>
            <mat-option value="STAFF">STAFF</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Store Locations</mat-label>
          <mat-select formControlName="locationIds" multiple>
            <mat-option *ngFor="let s of stores" [value]="s.id">{{ s.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <mat-divider></mat-divider>

      <!-- Manager-editable performance fields -->
      <div class="section-head">Performance (Manager fields)</div>
      <div class="grid">
        <mat-form-field appearance="outline">
          <mat-label>On-Time Rate (%)</mat-label>
          <input type="number" matInput formControlName="onTimeRate" min="0" max="100" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Attitude (1–5)</mat-label>
          <input type="number" matInput formControlName="attitudeScore" min="1" max="5" />
        </mat-form-field>

        <mat-form-field class="full" appearance="outline">
          <mat-label>Coaching Notes</mat-label>
          <textarea rows="3" matInput formControlName="coachingNotes"></textarea>
        </mat-form-field>
      </div>
    </form>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()">Save</button>
    </div>
  `,
  styles: [`
    .wrap { min-width: 560px; display:flex; flex-direction:column; gap:12px; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    .grid .full { grid-column: 1 / -1; }
    .section-head { font-weight:700; margin-top:8px; }
    @media (max-width: 640px) { .wrap { min-width: 0; } .grid { grid-template-columns: 1fr; } }
  `]
})
export class UserEditDialog {
  private ref = inject(MatDialogRef<UserEditDialog>);
  private data = inject<EditData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private perf = inject(PerformanceService);

  stores = mockStores;

  target = mockUsers.find(u => u.email.toLowerCase() === this.data.email.toLowerCase());
  latestPerf = this.target ? this.perf.latestForUser(this.target.id) : undefined;
  latestPeriod = this.latestPerf?.period ?? null;

  fm = this.fb.nonNullable.group({
    id: this.fb.nonNullable.control(this.target?.id ?? ''),
    name: this.fb.nonNullable.control(this.target?.name ?? '', { validators: [Validators.required] }),
    email: this.fb.nonNullable.control(this.target?.email ?? '', { validators: [Validators.required, Validators.email] }),
    roles: this.fb.nonNullable.control<Role[]>([...((this.target?.roles ?? []) as Role[])]),
    locationIds: this.fb.nonNullable.control<string[]>([...((this.target?.locationIds ?? this.target?.assignments?.map(a => a.locationId) ?? []) as string[])]),

    // Manager fields (may be null if not set)
    onTimeRate: this.fb.control<number | null>(this.latestPerf?.onTimeRate ?? null),
    attitudeScore: this.fb.control<number | null>(this.latestPerf?.attitudeScore ?? null, { validators: [Validators.min(1), Validators.max(5)] }),
    coachingNotes: this.fb.nonNullable.control(this.latestPerf?.coachingNotes ?? ''),
  });

  close(): void { this.ref.close(); }

  save(): void {
    const v = this.fm.getRawValue();
    const result: EditUserResult = {
      id: v.id,                                // non-nullable
      name: v.name,                            // non-nullable
      email: (v.email || '').toLowerCase(),    // non-nullable control; sanitize anyway
      roles: v.roles ?? [],
      locationIds: v.locationIds ?? []
    };

    // Persist manager fields (latest period only, if known)
    if (this.target && this.latestPeriod) {
      this.perf.updateManagerFields(this.target.id, this.latestPeriod, {
        onTimeRate: v.onTimeRate,
        attitudeScore: v.attitudeScore,
        coachingNotes: v.coachingNotes ?? '',
      });
    }

    this.ref.close(result);
  }
}
