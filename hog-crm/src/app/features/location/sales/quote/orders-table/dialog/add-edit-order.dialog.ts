import { Component, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { OrderItem, FulfillmentStatus } from '../../../../../../types/sales/quote/orders.types';
type DialogMode = 'add' | 'edit';
interface DialogData { mode: DialogMode; value?: OrderItem; }

@Component({
  standalone: true,
  selector: 'hog-add-edit-order-dialog',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './add-edit-order.dialog.html',
  styles: [`.hog-dialog .mat-mdc-dialog-surface{ background:#fff !important; color:#0f172a !important; }`]
})
export class AddEditOrderDialog {
  private ref = inject(MatDialogRef<AddEditOrderDialog>);
  private fb = inject(FormBuilder);
  public data = inject<DialogData>(MAT_DIALOG_DATA);

  statuses: FulfillmentStatus[] = ['Pending','In Progress','Fulfilled','Canceled'];

  form = this.fb.group({
    status: ['Pending' as FulfillmentStatus, Validators.required]
  });

  ngOnInit(){
    if (this.data.mode === 'edit' && this.data.value) {
      this.form.patchValue({ status: this.data.value.status });
    }
  }

  save(){
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload: OrderItem = { ...(this.data.value as OrderItem), status: v.status!, updatedAt: new Date().toISOString() };
    this.ref.close(payload);
  }
}
