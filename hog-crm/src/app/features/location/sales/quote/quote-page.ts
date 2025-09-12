import { Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QuoteItem, QuoteStatus } from '../../../../types/sales/quote/quotes.types';
import { QuotesService } from './quotes.service';
import { AddEditQuoteDialog } from './dialog/add-edit-quote.dialog';
@Component({
  standalone: true,
  selector: 'hog-quotes-page',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, RouterLink,
    FormsModule, ReactiveFormsModule,
    MatTableModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatDialogModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './quote-page.html',
  styleUrls: ['./quote-page.scss']
})
export class QuotesPage {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private svc = inject(QuotesService);

  displayedColumns = ['select','customer','quoteNumber','items','total','status','owner','updatedAt','actions'];

  data = signal<QuoteItem[]>(this.svc.all());
  selection = new SelectionModel<QuoteItem>(true, []);

  owners = this.svc.owners;
  statuses: QuoteStatus[] = ['Draft','Sent','Accepted','Rejected'];

  // Quick Add (one row)
  quickAddForm = this.fb.group({
    customer: ['', Validators.required],
    ownerId: ['', Validators.required],
  });

  // Filters (one row)
  filterForm = this.fb.group({
    search: [''],
    status: ['' as '' | QuoteStatus],
    ownerId: [''],
    from: <Date | null>null,
    to: <Date | null>null
  });

  filtered = computed(() => {
    const items = this.data();
    const f = this.filterForm.value;
    const term = (f.search ?? '').toLowerCase();

    return items.filter(q => {
      if (f.status && q.status !== f.status) return false;
      if (f.ownerId && q.ownerId !== f.ownerId) return false;

      if (f.from && new Date(q.updatedAt) < f.from) return false;
      if (f.to) {
        const end = new Date(f.to); end.setHours(23,59,59,999);
        if (new Date(q.updatedAt) > end) return false;
      }

      if (term) {
        const blob = `${q.customer} ${q.quoteNumber} ${q.ownerName}`.toLowerCase();
        if (!blob.includes(term)) return false;
      }
      return true;
    });
  });

  constructor() {
    // default owner for quick add
    if (!this.quickAddForm.value.ownerId && this.owners[0]) {
      this.quickAddForm.patchValue({ ownerId: this.owners[0].id });
    }
    // clear selection when filter output changes
    effect(() => { this.filtered(); this.selection.clear(); });
  }

  openAdd() {
    const ref = this.dialog.open(AddEditQuoteDialog, {
      panelClass: 'hog-dialog',
      data: { mode: 'add' }
    });
    ref.afterClosed().subscribe((val: QuoteItem | undefined) => {
      if (!val) return;
      // QuotesService already inserted on createDraft; refresh local signal snapshot
      this.data.set(this.svc.all());
    });
  }

  openEdit(row: QuoteItem) {
    const ref = this.dialog.open(AddEditQuoteDialog, {
      panelClass: 'hog-dialog',
      data: { mode: 'edit', value: row }
    });
    ref.afterClosed().subscribe((val: QuoteItem | undefined) => {
      if (!val) return;
      this.svc.upsert(val);
      this.data.set(this.svc.all());
    });
  }

  delete(row: QuoteItem) {
    this.svc.remove(row.id);
    this.data.set(this.svc.all());
    this.selection.deselect(row);
  }

  quickAdd() {
    if (this.quickAddForm.invalid) return;
    const v = this.quickAddForm.value;
    const owner = this.owners.find(o => o.id === v.ownerId);
    this.svc.createDraft(v.customer!, v.ownerId!, owner?.name ?? 'Unassigned');
    this.data.set(this.svc.all());
    this.quickAddForm.reset({
      customer: '',
      ownerId: owner?.id ?? this.owners[0]?.id ?? ''
    });
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      status: '',
      ownerId: '',
      from: null,
      to: null
    });
  }
}