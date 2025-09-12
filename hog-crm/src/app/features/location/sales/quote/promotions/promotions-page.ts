// src/app/features/location/sales/quote/promotions/promotions-page.ts
import { Component, ViewEncapsulation, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { PromotionsService, Promotion, PromotionStatus } from './promotions.service';
import { PromotionDetailsDialog } from './dialog/promotion-details.dialog';

@Component({
  standalone: true,
  selector: 'hog-promotions-page',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, RouterModule,
    FormsModule, ReactiveFormsModule,
    MatTableModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatCheckboxModule, MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './promotions-page.html',
  styleUrls: ['./promotions-page.scss']
})
export class PromotionsPage {
  private fb = inject(FormBuilder);
  private svc = inject(PromotionsService);
  private dialog = inject(MatDialog);

  displayedColumns = ['name','code','discount','dates','status','categories','eligible','flags','actions'];

  data = computed(() => this.svc.all());
  categories = this.svc.categories;

  // one-row filters
  filterForm = this.fb.group({
    search: [''],
    status: ['All' as 'All' | PromotionStatus],
    category: [''],
    stackableOnly: [false],
    approvalOnly: [false],
    date: <Date | null>null
  });

  filtered = computed(() => {
    const term = (this.filterForm.value.search ?? '').toLowerCase();
    const status = this.filterForm.value.status;
    const cat = this.filterForm.value.category;
    const stack = !!this.filterForm.value.stackableOnly;
    const appr = !!this.filterForm.value.approvalOnly;
    const onDate = this.filterForm.value.date as Date | null;
    const items = this.data();

    return items.filter(p => {
      const st = this.svc.statusFor(p, onDate ?? new Date());
      if (status !== 'All' && st !== status) return false;
      if (cat && !p.categories.includes(cat)) return false;
      if (stack && !p.stackable) return false;
      if (appr && !p.approvalRequired) return false;

      if (term) {
        const blob = `${p.name} ${p.code} ${p.categories.join(' ')} ${p.eligibleSkus.join(' ')}`.toLowerCase();
        if (!blob.includes(term)) return false;
      }
      return true;
    });
  });

  constructor() {
    effect(() => { this.filtered(); /* trigger for future paginator if needed */ });
  }

  statusChip(p: Promotion): { label: PromotionStatus; color: 'primary'|'accent'|'warn'|undefined } {
    const s = this.svc.statusFor(p);
    switch (s) {
      case 'Active': return { label: s, color: 'primary' };
      case 'Scheduled': return { label: s, color: 'accent' };
      case 'Expired': return { label: s, color: 'warn' };
    }
  }

  viewDetails(p: Promotion) {
    this.dialog.open(PromotionDetailsDialog, { panelClass: 'hog-dialog', data: p });
  }

  copyCode(p: Promotion) {
    navigator.clipboard?.writeText(p.code);
  }

  clearFilters() {
    this.filterForm.reset({ search:'', status:'All', category:'', stackableOnly:false, approvalOnly:false, date:null });
  }
}
