import { Component, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { QuoteItem, QuoteStatus } from '../../../../../types/sales/quote/quotes.types';
import { QuotesService } from '../quotes.service';

type DialogMode = 'add' | 'edit';
interface DialogData { mode: DialogMode; value?: QuoteItem; }

@Component({
  standalone: true,
  selector: 'hog-add-edit-quote-dialog',
  encapsulation: ViewEncapsulation.None, // allow .hog-dialog overrides in overlay
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule
  ],
  templateUrl: './add-edit-quote.dialog.html',
  styleUrls: ['./add-edit-quote.dialog.scss']
})
export class AddEditQuoteDialog {
  private ref = inject(MatDialogRef<AddEditQuoteDialog>);
  private fb = inject(FormBuilder);
  private svc = inject(QuotesService);
  public data = inject<DialogData>(MAT_DIALOG_DATA);

  statuses: QuoteStatus[] = ['Draft','Sent','Accepted','Rejected'];
  owners = this.svc.owners;

  form = this.fb.group({
    customer: ['', Validators.required],
    ownerId: ['', Validators.required],
    status: ['Draft' as QuoteStatus, Validators.required],
    notes: ['']
  });

  ngOnInit(){
    if (this.data.mode === 'edit' && this.data.value) {
      const v = this.data.value;
      this.form.setValue({
        customer: v.customer,
        ownerId: v.ownerId,
        status: v.status,
        notes: v.notes ?? ''
      });
    } else if (!this.form.value.ownerId && this.owners[0]) {
      this.form.patchValue({ ownerId: this.owners[0].id });
    }
  }

  save(){
    if (this.form.invalid) return;
    const v = this.form.value;
    const owner = this.owners.find(o => o.id === v.ownerId);
    const now = new Date().toISOString();

    const payload: QuoteItem = this.data.mode === 'edit' && this.data.value
      ? { ...this.data.value,
          customer: v.customer!, ownerId: v.ownerId!, ownerName: owner?.name ?? 'Unassigned',
          status: v.status!, notes: v.notes ?? '', updatedAt: now }
      : this.svc.createDraft(v.customer!, v.ownerId!, owner?.name ?? 'Unassigned');

    this.ref.close(payload);
  }
}
