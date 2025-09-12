import { Component, Input, ViewEncapsulation, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { OrderItem } from '../../../../../types/sales/quote/orders.types';
import { OrdersService } from './orders.service';
import { AddEditOrderDialog } from './dialog/add-edit-order.dialog';
import { PromotionsService, Promotion } from '../promotions/promotions.service';
import { FinancingService } from '../financing-table/financing.service';
import { PromotionPickerDialog } from '../promotions/dialog/promotion-picker.dialog';
import { MatMenuModule } from '@angular/material/menu';


@Component({
  standalone: true,
  selector: 'hog-orders-table',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatTableModule, MatSortModule, MatButtonModule, MatIconModule, MatDialogModule, MatMenuModule],
  templateUrl: './orders-table.html',
  styleUrls: ['./orders-table.scss']
})
export class OrdersTable {
  @Input({ required: true }) quoteId!: string;

  private dialog = inject(MatDialog);
  private ordersSvc = inject(OrdersService);
  private promos = inject(PromotionsService);
  private finSvc = inject(FinancingService);

  displayedColumns = ['select','orderNumber','quoteNumber','promo','total','status','createdAt','actions'];

  data = computed(() => this.ordersSvc.listByQuote(this.quoteId));
  selection = new SelectionModel<OrderItem>(true, []);

  constructor() { effect(() => { this.data(); this.selection.clear(); }); }

  createFromCurrentQuote() { this.ordersSvc.createFromQuoteId(this.quoteId); }

  applyPromo(row: OrderItem) {
    const ref = this.dialog.open(PromotionPickerDialog, { panelClass: 'hog-dialog' });
    ref.afterClosed().subscribe((promo: Promotion | undefined) => {
      if (!promo) return;
      this.ordersSvc.applyPromotionToOrder(row.id, promo);
    });
  }

  openEdit(row: OrderItem) {
    const ref = this.dialog.open(AddEditOrderDialog, { panelClass: 'hog-dialog', data: { mode: 'edit', value: row } });
    ref.afterClosed().subscribe((val: OrderItem | undefined) => { if (val) this.ordersSvc.upsert(val); });
  }

  delete(row: OrderItem) { this.ordersSvc.delete(row.id); }
}