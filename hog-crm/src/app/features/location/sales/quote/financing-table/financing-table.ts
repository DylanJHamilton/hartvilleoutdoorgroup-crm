import { Component, Input, ViewEncapsulation, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { FinancingApp } from '../../../../../types/sales/quote/financing.types';
import { FinancingService } from './financing.service';
import { AddEditFinancingDialog } from './dialog/add-edit-financing.dialog';

@Component({
  standalone: true,
  selector: 'hog-financing-table',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatTableModule, MatSortModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './financing-table.html',
  styleUrls: ['./financing-table.scss']
})
export class FinancingTable {
  @Input({ required: true }) quoteId!: string;

  private dialog = inject(MatDialog);
  private finSvc = inject(FinancingService);

  displayedColumns = ['select','provider','applicationNumber','status','owner','amountFinanced','downPayment','estimatedMonthly','createdAt','actions'];

  data = computed(() => this.finSvc.listByQuote(this.quoteId));
  selection = new SelectionModel<FinancingApp>(true, []);

  constructor(){ effect(() => { this.data(); this.selection.clear(); }); }

  openEdit(row: FinancingApp) {
    const ref = this.dialog.open(AddEditFinancingDialog, { panelClass:'hog-dialog', data:{ mode:'edit', value: row } });
    ref.afterClosed().subscribe((val: FinancingApp | undefined) => { if (val) this.finSvc.upsert(val); });
  }

  delete(row: FinancingApp) { this.finSvc.delete(row.id); }
}
