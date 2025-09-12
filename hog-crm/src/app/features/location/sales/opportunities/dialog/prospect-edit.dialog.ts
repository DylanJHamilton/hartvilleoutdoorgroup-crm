// src/app/features/location/sales/opportunities/dialogs/prospect-edit-dialog.ts
import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { ProspectOpportunity } from '../../../../../types/sales/prospecting/prospect.types';
import type { OpportunityStatus } from '../../../../../types/sales/prospecting/opportunity.types';

export type ProspectEditMode = 'create' | 'edit';

export interface ProspectEditData {
  mode: ProspectEditMode;
  prospect?: ProspectOpportunity;     // present in edit mode
  owners: string[];                   // dropdown options
  pipelines: string[];                // dropdown options
  statuses: OpportunityStatus[];      // dropdown options
}

export interface ProspectEditResult {
  mode: ProspectEditMode;
  prospect: ProspectOpportunity;
}


@Component({
  standalone: true,
  selector: 'hog-prospect-edit-dialog',
  imports: [
    CommonModule, MatDialogModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title class="dlg-title">
      <mat-icon>{{ data.mode === 'create' ? 'person_add' : 'edit' }}</mat-icon>
      <span>{{ data.mode === 'create' ? 'Add Prospect' : 'Edit Prospect' }}</span>
    </h2>

    <form [formGroup]="fm" (ngSubmit)="save()" mat-dialog-content class="dlg-content">
      <div class="grid">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Customer</mat-label>
          <input matInput formControlName="customer" />
          <mat-error *ngIf="fm.get('customer')?.hasError('required')">Required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
          <mat-error *ngIf="fm.get('title')?.hasError('required')">Required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Pipeline</mat-label>
          <mat-select formControlName="pipeline">
            <mat-option *ngFor="let p of data.pipelines" [value]="p">{{ p }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option *ngFor="let s of data.statuses" [value]="s">{{ s }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Owner</mat-label>
          <mat-select formControlName="owner">
            <mat-option [value]="null">Unassigned</mat-option>
            <mat-option *ngFor="let o of data.owners" [value]="o">{{ o }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Value</mat-label>
          <input matInput type="number" min="0" formControlName="value" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Age (days)</mat-label>
          <input matInput type="number" min="0" formControlName="ageDays" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Source</mat-label>
          <input matInput formControlName="source" />
        </mat-form-field>
      </div>
    </form>

    <div mat-dialog-actions class="dlg-actions" align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="fm.invalid" (click)="save()">
        {{ data.mode === 'create' ? 'Add' : 'Save' }}
      </button>
    </div>
  `,
  styles: [`
    /* Canvas */
    :host { display: block; }
    .dlg-title {
      display:flex; align-items:center; gap:8px;
      color:#0f172a; /* dark text */
    }
    .dlg-content {
      background:#ffffff; /* white */
      color:#0f172a;
      display:flex; flex-direction:column; gap:12px;
      padding-top:4px;
    }

    /* Layout */
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    .full { grid-column: 1 / -1; }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }

    /* Inputs: white bg, dark text, compact height */
    .mat-mdc-form-field .mdc-text-field {
      background:#fff; border-radius:10px; height:44px;
    }
    .mdc-text-field__input { color:#0f172a !important; }
    .mat-mdc-select-value, .mat-mdc-select-arrow { color:#0f172a !important; }
    .mat-mdc-form-field-subscript-wrapper { display:none; }
    .mat-mdc-form-field-infix { padding-top:10px; padding-bottom:10px; }

    /* Buttons: blue accents */
    .dlg-actions { padding-top: 4px; }
    .mat-mdc-unelevated-button.mat-primary,
    .mat-mdc-raised-button.mat-primary {
      --mdc-filled-button-container-color: #2563eb;  /* blue-600 */
      --mdc-filled-button-label-text-color: #ffffff;
    }
    .mat-mdc-unelevated-button.mat-primary:hover,
    .mat-mdc-raised-button.mat-primary:hover {
      --mdc-filled-button-container-color: #1d4ed8;  /* blue-700 */
    }

    /* Stroked/outlined primary (if used here later) */
    .mat-mdc-stroked-button.mat-primary {
      --mdc-outlined-button-outline-color: #2563eb;
      --mdc-outlined-button-label-text-color: #1d4ed8;
    }
    .mat-mdc-stroked-button.mat-primary:hover {
      --mdc-outlined-button-outline-color: #1d4ed8;
      background:#eff6ff; /* blue-50 */
    }

    /* Dialog surface itself (ensures light bg even if app theme flips) */
    ::ng-deep .mat-mdc-dialog-surface {
      background: #ffffff !important;
      color: #0f172a !important;
    }
  `]
})
export class ProspectEditDialog {
  fm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<ProspectEditDialog, ProspectEditResult>,
    @Inject(MAT_DIALOG_DATA) public data: ProspectEditData
  ) {
    const p = data.prospect;
    this.fm = this.fb.group({
      id: [p?.id ?? `draft_${Date.now()}`],
      customer: [p?.customer ?? '', [Validators.required]],
      title: [p?.title ?? '', [Validators.required]],
      pipeline: [p?.pipeline ?? (data.pipelines[0] ?? 'Retail')],
      status: [p?.status ?? ('New' as OpportunityStatus)],
      owner: [p?.owner ?? null], // null = Unassigned
      value: [p?.value ?? 0],
      ageDays: [p?.ageDays ?? 0],
      source: [p?.source ?? 'Website'],
      duplicate: [p?.duplicate ?? false],
    });
  }

  close() { this.ref.close(); }

  save() {
    if (this.fm.invalid) return;
    const v = this.fm.getRawValue() as ProspectOpportunity & { owner: string | null };
    const prospect: ProspectOpportunity = { ...v, owner: v.owner ?? undefined };
    this.ref.close({ mode: this.data.mode, prospect });
  }
}