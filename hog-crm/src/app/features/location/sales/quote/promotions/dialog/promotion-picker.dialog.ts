import { Component, ViewEncapsulation, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { PromotionsService, Promotion } from '../../promotions/promotions.service';

@Component({
  standalone: true,
  selector: 'hog-promotion-picker-dialog',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, ReactiveFormsModule, MatChipsModule
  ],
  templateUrl: './promotion-picker.dialog.html',
  styleUrls: ['./promotion-picker.dialog.scss']
})
export class PromotionPickerDialog {
  private ref = inject(MatDialogRef<PromotionPickerDialog>);
  private svc = inject(PromotionsService);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    search: [''],
    category: [''],
    status: ['Active'] as any
  });

  categories = this.svc.categories;

  list = computed(() => {
    const term = (this.form.value.search ?? '').toLowerCase();
    const cat = this.form.value.category ?? '';
    const status = this.form.value.status as 'Active'|'Scheduled'|'Expired'|'All';

    return this.svc.all().filter(p => {
      const st = this.svc.statusFor(p);
      if (status && status !== 'All' && st !== status) return false;
      if (cat && !p.categories.includes(cat)) return false;
      if (term) {
        const blob = `${p.name} ${p.code} ${p.categories.join(' ')} ${p.eligibleSkus.join(' ')}`.toLowerCase();
        if (!blob.includes(term)) return false;
      }
      return true;
    });
  });

  choose(p: Promotion) { this.ref.close(p); }
  clear() { this.ref.close(undefined); }
}
