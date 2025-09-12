// src/app/features/location/sales/opportunities/dialogs/prospect-delete-dialog.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ProspectDeleteData {
  customer: string;
  title?: string;
}
export interface ProspectDeleteResult {
  confirm: boolean;
}

@Component({
  standalone: true,
  selector: 'hog-prospect-delete-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="head">
      <mat-icon color="warn">delete</mat-icon>
      Delete Prospect?
    </h2>
    <div mat-dialog-content class="body">
      <p>You are about to remove the prospect:</p>
      <p class="strong">{{ data.customer }} <ng-container *ngIf="data.title">— {{ data.title }}</ng-container></p>
      <p>This action cannot be undone.</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">Cancel</button>
      <button mat-flat-button color="warn" (click)="close(true)">Delete</button>
    </div>
  `,
  styles: [`
    .head { display:flex; align-items:center; gap:8px; }
    .body { display:flex; flex-direction:column; gap:6px; }
    .strong { font-weight:600; }
  `]
})
export class ProspectDeleteDialog {
  constructor(
    private ref: MatDialogRef<ProspectDeleteDialog, ProspectDeleteResult>,
    @Inject(MAT_DIALOG_DATA) public data: ProspectDeleteData
  ) {}
  close(confirm: boolean) { this.ref.close({ confirm }); }
}
