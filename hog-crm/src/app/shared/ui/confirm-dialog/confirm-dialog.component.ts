import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'hog-confirm-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <div mat-dialog-content><p>{{ message }}</p></div>
    <div mat-dialog-actions style="display:flex;gap:8px;justify-content:flex-end">
      <button mat-stroked-button (click)="cancel()">Cancel</button>
      <button mat-flat-button color="warn" (click)="ok()">Delete</button>
    </div>
  `
})
export class ConfirmDialogComponent {
  private ref = inject(MatDialogRef<ConfirmDialogComponent, boolean>, { optional: true });
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Output() confirmed = new EventEmitter<boolean>();
  cancel(){ this.ref ? this.ref.close(false) : this.confirmed.emit(false); }
  ok(){ this.ref ? this.ref.close(true) : this.confirmed.emit(true); }
}
