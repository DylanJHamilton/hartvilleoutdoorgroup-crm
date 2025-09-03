// src/app/features/portal/users/dialogs/deletion-request.dialog.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

export interface DeletionRequestDialogData {
  targetEmail: string;
  targetName: string;
}
export interface DeletionRequestResult {
  targetEmail: string;
  reason?: string;
}

@Component({
  standalone: true,
  selector: 'hog-deletion-request-dialog',
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Request Deletion</h2>
    <div mat-dialog-content>
      <p>You’re requesting deletion for <strong>{{data.targetName}}</strong> ({{data.targetEmail}}).</p>
      <mat-form-field appearance="outline" class="w100">
        <mat-label>Reason (optional)</mat-label>
        <textarea matInput rows="4" [(ngModel)]="reason"></textarea>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-flat-button color="warn" (click)="submit()">Submit request</button>
    </div>
  `,
  styles: [`.w100{width:100%;} `]
})
export class DeletionRequestDialog {
  reason = '';
  constructor(
    private ref: MatDialogRef<DeletionRequestDialog, DeletionRequestResult>,
    @Inject(MAT_DIALOG_DATA) public data: DeletionRequestDialogData
  ) {}
  close() { this.ref.close(); }
  submit() {
    this.ref.close({ targetEmail: this.data.targetEmail, reason: this.reason?.trim() || undefined });
  }
}
