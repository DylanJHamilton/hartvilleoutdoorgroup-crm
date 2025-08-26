// src/app/features/store/customers/confirm-dialog.component.ts
import { Component, Inject, Optional, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

type ConfirmData = { title?: string; message?: string };

@Component({
  standalone: true,
  selector: 'hog-confirm-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <div mat-dialog-content>
      <p>{{ message }}</p>
    </div>
    <div mat-dialog-actions style="display:flex;gap:8px;justify-content:flex-end">
      <button mat-stroked-button (click)="cancel()">Cancel</button>
      <button mat-flat-button color="warn" (click)="ok()">Delete</button>
    </div>
  `
})
export class ConfirmDialogComponent {
  // Works even if someone uses <hog-confirm-dialog> directly in a template
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';

  // Emits when not used via MatDialog (fallback)
  @Output() confirmed = new EventEmitter<boolean>();

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) data: ConfirmData | null,
    @Optional() private ref: MatDialogRef<ConfirmDialogComponent, boolean> | null,
  ) {
    if (data) {
      if (data.title) this.title = data.title;
      if (data.message) this.message = data.message;
    }
  }

  cancel() {
    if (this.ref) this.ref.close(false);
    else this.confirmed.emit(false);
  }
  ok() {
    if (this.ref) this.ref.close(true);
    else this.confirmed.emit(true);
  }
}
