import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export type DeletionRequestData = { targetName: string };
export type DeletionRequestResult = { reason: string };

@Component({
  standalone: true,
  selector: 'hog-customer-deletion-request-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
  <h2 mat-dialog-title>Request Deletion</h2>
  <div mat-dialog-content [formGroup]="form">
    <p>Explain why you’re requesting to delete <strong>{{ data.targetName }}</strong>.</p>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Reason</mat-label>
      <textarea matInput rows="4" formControlName="reason" required></textarea>
      <mat-error *ngIf="form.controls.reason.invalid">A reason is required</mat-error>
    </mat-form-field>
  </div>

  <div mat-dialog-actions align="end">
    <button mat-button (click)="close()">Cancel</button>
    <button mat-flat-button color="primary" (click)="submit()" [disabled]="form.invalid">Submit</button>
  </div>
  `,
  styles: [`.full{width:100%;}`]
})
export class CustomerDeletionRequestDialog {
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<CustomerDeletionRequestDialog, DeletionRequestResult | undefined>);
  data = inject<DeletionRequestData>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3)]],
  });

  close(): void {
    this.ref.close(undefined);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.ref.close({ reason: this.form.value.reason ?? '' });
  }
}
