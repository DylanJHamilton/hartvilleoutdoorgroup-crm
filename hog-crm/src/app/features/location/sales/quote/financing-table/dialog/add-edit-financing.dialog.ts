import { Component, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { FinancingApp, FinancingStatus } from '../../../../../../types/sales/quote/financing.types';

type DialogMode = 'add' | 'edit';
interface DialogData { mode: DialogMode; value?: FinancingApp; }

@Component({
  standalone: true,
  selector: 'hog-add-edit-financing-dialog',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './add-edit-financing.dialog.html',
  styles: [`.hog-dialog .mat-mdc-dialog-surface{ background:#fff !important; color:#0f172a !important; }`]
})
export class AddEditFinancingDialog {
  private ref = inject(MatDialogRef<AddEditFinancingDialog>);
  private fb = inject(FormBuilder);
  public data = inject<DialogData>(MAT_DIALOG_DATA);

  statuses: FinancingStatus[] = ['Pending','Approved','Declined','Funded'];

  form = this.fb.group({
    provider: ['', Validators.required],
    applicationNumber: ['', Validators.required],
    status: ['Pending' as FinancingStatus, Validators.required],
    notes: ['']
  });

  ngOnInit(){
    if (this.data.mode === 'edit' && this.data.value) {
      const v = this.data.value;
      this.form.setValue({ provider: v.provider, applicationNumber: v.applicationNumber, status: v.status, notes: v.notes ?? '' });
    }
  }

  save(){
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload: FinancingApp = { ...(this.data.value as FinancingApp), provider: v.provider!, applicationNumber: v.applicationNumber!, status: v.status!, notes: v.notes ?? '', updatedAt: new Date().toISOString() };
    this.ref.close(payload);
  }
}
