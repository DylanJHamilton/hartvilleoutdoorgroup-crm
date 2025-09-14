import { Component, Input, ViewEncapsulation, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Dept, Pipeline, Stage, Customer as CustomerRow } from '../services/customer.service';

type DialogData = Partial<CustomerRow> | null;

@Component({
  standalone: true,
  selector: 'hog-customer-dialog',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
  styles: [`
    :root { --hog-primary:#1d4ed8; --hog-ink:#0f172a; }

    /* Make the dialog container a column flex layout so actions can stick */
    .hog-dialog-panel .mat-mdc-dialog-container { display:flex; flex-direction:column; }
    .hog-dialog-panel .mat-mdc-dialog-surface   { background:#fff !important; color:var(--hog-ink); }
    .hog-dialog-panel .mat-mdc-dialog-title     { color:var(--hog-ink); font-weight:600; }

    /* Scroll the content, keep actions visible */
    .hog-dialog-panel .mat-mdc-dialog-content {
      flex: 1 1 auto;
      overflow: auto;
      max-height: none;               /* flex controls height */
      padding-bottom: 12px;
    }
    .hog-dialog-panel .mat-mdc-dialog-actions {
      flex: 0 0 auto;
      position: sticky;
      bottom: 0;
      background: #fff;
      z-index: 1;
      border-top: 1px solid rgba(2,6,23,.08);
      padding-top: 8px;
    }

    /* Two-column form */
    .form { display:grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap:12px; }
    @media (max-width: 800px) { .form { grid-template-columns: 1fr; } }
    .notes { grid-column: 1 / -1; }
    mat-form-field { width:100%; }

    /* Primary accents + readable labels */
    .hog-dialog-panel .mat-mdc-text-field-wrapper { background:#fff; }
    .hog-dialog-panel .mat-mdc-form-field-appearance-outline .mdc-notched-outline__leading,
    .hog-dialog-panel .mat-mdc-form-field-appearance-outline .mdc-notched-outline__notch,
    .hog-dialog-panel .mat-mdc-form-field-appearance-outline .mdc-notched-outline__trailing { border-color: var(--hog-primary) !important; }
    .hog-dialog-panel .mdc-floating-label { color: var(--hog-ink) !important; opacity:.95; }
    .hog-dialog-panel .mat-mdc-form-field.mat-focused .mdc-floating-label { color: var(--hog-primary) !important; }
    .hog-dialog-panel .mat-mdc-input-element, .hog-dialog-panel .mat-mdc-select-value-text { color: var(--hog-ink) !important; }
    .hog-dialog-panel .mat-mdc-select-arrow { color: var(--hog-primary) !important; }

    .actions { display:flex; gap:8px; justify-content:flex-end; }
  `],
  template: `
    <h2 mat-dialog-title>
      {{ id ? 'Edit Customer' : 'New Customer' }}
    </h2>

    <div mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" color="primary" floatLabel="always">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
        </mat-form-field>

        <mat-form-field appearance="outline" color="primary" floatLabel="always">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email">
        </mat-form-field>

        <mat-form-field appearance="outline" color="primary" floatLabel="always">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone" placeholder="330-555-1100">
        </mat-form-field>

        <mat-form-field appearance="outline" color="primary" floatLabel="always">
          <mat-label>Interested Product</mat-label>
          <input matInput formControlName="interestedProduct" placeholder="10x12 Shed / EZGO etc.">
        </mat-form-field>

        <mat-form-field appearance="outline" color="primary" floatLabel="always">
          <mat-label>Pipeline</mat-label>
          <mat-select formControlName="pipeline">
            <mat-option *ngFor="let p of pipelines" [value]="p">{{ p }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" color="primary" floatLabel="always">
          <mat-label>Stage</mat-label>
          <mat-select formControlName="stage">
            <mat-option *ngFor="let s of stages" [value]="s">{{ s }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" color="primary" floatLabel="always">
          <mat-label>Owner</mat-label>
          <mat-select formControlName="owner">
            <mat-option *ngFor="let o of owners" [value]="o">{{ o }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" color="primary" floatLabel="always">
          <mat-label>Assigned Dept</mat-label>
          <mat-select formControlName="assignedDept">
            <mat-option *ngFor="let d of depts" [value]="d">{{ d }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" color="primary" floatLabel="always" class="notes">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="4"></textarea>
        </mat-form-field>
      </form>
    </div>

    <div mat-dialog-actions class="actions">
      <!-- make Cancel readable (blue text & border) -->
      <button mat-stroked-button color="primary" (click)="cancel()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Save</button>
    </div>
  `
})
export class CustomerDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CustomerDialogComponent, Partial<CustomerRow> | null>, { optional: true });

  pipelines: Pipeline[] = ['Sheds','Barns','Cabins','Furniture','Swing Sets','Trampolines','Playgrounds','Golf Carts','E-Bikes'];
  stages: Stage[] = ['Intake','Qualified','Quoted','Won','Delivered','Lost'];
  owners = ['Alice','Ben','Cara','Dan'];
  depts:  Dept[]  = ['SALES','SUPPORT','SERVICE','DELIVERY'];

  id: string | undefined;

  form = this.fb.group({
    name: ['', Validators.required],
    email: [''],
    phone: [''],
    interestedProduct: [''],
    pipeline: ['Sheds' as Pipeline],
    stage: ['Intake' as Stage],
    owner: [this.owners[0]],
    assignedDept: ['SALES' as Dept],
    notes: ['']
  });

  constructor(@Inject(MAT_DIALOG_DATA) data: DialogData) {
    if (data) this.patch(data);
  }

  @Input() set inputData(v: DialogData) { if (v) this.patch(v); }

  private patch(d: Partial<CustomerRow>) {
    this.id = d.id;
    this.form.patchValue({
      name: d.name ?? '',
      email: d.email ?? '',
      phone: d.phone ?? '',
      interestedProduct: d.interestedProduct ?? '',
      pipeline: d.pipeline ?? ('Sheds' as Pipeline),
      stage: d.stage ?? ('Intake' as Stage),
      owner: d.owner ?? this.owners[0],
      assignedDept: d.assignedDept ?? 'SALES',
      notes: d.notes ?? ''
    });
  }

  cancel() { this.dialogRef?.close(null); }
  save()   { this.dialogRef?.close({ id: this.id, ...this.form.getRawValue() }); }
}
