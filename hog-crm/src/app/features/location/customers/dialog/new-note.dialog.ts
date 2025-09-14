import { Component, Inject, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'hog-new-note-dialog',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  styles: [`
    .hog-dialog-panel .mat-mdc-dialog-surface { background:#fff !important; }
    .hog-dialog-panel .mat-mdc-dialog-content { max-height: calc(85vh - 112px); overflow:auto; padding-bottom:12px; }
    .hog-dialog-panel .mat-mdc-dialog-actions { position:sticky; bottom:0; background:#fff; border-top:1px solid rgba(2,6,23,.08); padding-top:8px; }
    .actions { display:flex; gap:8px; justify-content:flex-end; }
  `],
  template: `
    <h2 mat-dialog-title>Add Note for {{ data.customerName }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" color="primary" floatLabel="always" style="width:100%">
          <mat-label>Note</mat-label>
          <textarea matInput rows="4" formControlName="text"></textarea>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions class="actions">
      <button mat-stroked-button color="primary" (click)="ref.close(null)">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="ref.close(form.value.text)">Save</button>
    </div>
  `
})
export class NewNoteDialogComponent {
  private fb = inject(FormBuilder);
  form = this.fb.group({ text: ['', Validators.required] });

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public ref: MatDialogRef<NewNoteDialogComponent>) {}
}
