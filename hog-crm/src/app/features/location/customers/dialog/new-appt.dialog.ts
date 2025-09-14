import { Component, Inject, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'hog-new-appt-dialog',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  styles: [`
    .hog-dialog-panel .mat-mdc-dialog-surface { background:#fff !important; }
    .hog-dialog-panel .mat-mdc-dialog-content { max-height: calc(85vh - 132px); overflow:auto; padding-bottom:12px; }
    .hog-dialog-panel .mat-mdc-dialog-actions { position:sticky; bottom:0; background:#fff; border-top:1px solid rgba(2,6,23,.08); padding-top:8px; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
    .actions { display:flex; gap:8px; justify-content:flex-end; }
  `],
  template: `
    <h2 mat-dialog-title>New Appointment for {{ data.customerName }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" class="grid">
        <mat-form-field appearance="outline" color="primary" floatLabel="always">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" required>
        </mat-form-field>

        <span></span>

        <mat-form-field appearance="outline" color="primary" floatLabel="always">
          <mat-label>Starts</mat-label>
          <input matInput type="datetime-local" formControlName="startsAt" required>
        </mat-form-field>

        <mat-form-field appearance="outline" color="primary" floatLabel="always">
          <mat-label>Ends (optional)</mat-label>
          <input matInput type="datetime-local" formControlName="endsAt">
        </mat-form-field>

        <mat-form-field class="notes" appearance="outline" color="primary" floatLabel="always" style="grid-column:1/-1">
          <mat-label>Note</mat-label>
          <textarea matInput rows="3" formControlName="note"></textarea>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions class="actions">
      <button mat-stroked-button color="primary" (click)="ref.close(null)">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Save</button>
    </div>
  `
})
export class NewApptDialogComponent {
  private fb = inject(FormBuilder);
  form = this.fb.group({
    title: ['', Validators.required],
    startsAt: ['', Validators.required],
    endsAt: [''],
    note: ['']
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public ref: MatDialogRef<NewApptDialogComponent>) {}
  save() { this.ref.close(this.form.value); }
}
