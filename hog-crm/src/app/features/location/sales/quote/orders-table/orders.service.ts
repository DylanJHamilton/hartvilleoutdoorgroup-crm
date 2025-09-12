import { Injectable, signal } from '@angular/core';
import { OrderItem } from '../../../../../types/sales/quote/orders.types';
import { QuoteItem } from '../../../../../types/sales/quote/quotes.types';
import { seedOrders, orderFromQuote } from '../../../../../mock/orders.mock';
import { QuotesService } from '../quotes.service';
import { PromotionsService, Promotion } from '../promotions/promotions.service';
import { FinancingService } from '../financing-table/financing.service';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private _seq = signal(5000);
  private _orders = signal<OrderItem[]>([]);

  constructor(
    private quotesSvc: QuotesService,
    private promosSvc: PromotionsService,
    private financingSvc: FinancingService
  ) {
    // Seed once from current quotes
    this._orders.set(seedOrders(this.quotesSvc.all(), 212));
  }

  /** Read-only snapshot for a quote */
  listByQuote(quoteId: string) {
    return this._orders().filter(o => o.quoteId === quoteId);
  }

  upsert(o: OrderItem) {
    const arr = this._orders();
    const i = arr.findIndex(x => x.id === o.id);
    this._orders.set(i >= 0 ? arr.map(x => x.id === o.id ? o : x) : [o, ...arr]);
  }

  delete(id: string) {
    this._orders.set(this._orders().filter(o => o.id !== id));
  }

  /** Create an order from a quote id (used by “Create Order from Quote” or detail actions) */
  createFromQuoteId(quoteId: string) {
    const q = this.quotesSvc.byId(quoteId);
    if (!q) throw new Error('Quote not found');
    const next = this._seq() + 1; this._seq.set(next);
    const order = orderFromQuote(q as QuoteItem, next);
    this.upsert(order);
    return order;
  }

  /**
   * Apply a promotion to an order.
   * Stores minimal metadata on the order object (via indexer) so we don’t have to alter strict OrderItem type now.
   * Recalculates total and syncs Financing.
   */
  applyPromotionToOrder(orderId: string, promo: Promotion) {
    const arr = this._orders();
    const idx = arr.findIndex(o => o.id === orderId);
    if (idx < 0) return;

    const o = { ...arr[idx] } as any;

    const basis: number = typeof o.total === 'number' ? o.total : 0;
    const discount =
      promo.discountType === 'Percent'
        ? Math.round(basis * (promo.discountValue / 100))
        : Math.round(promo.discountValue);

    const newTotal = Math.max(0, basis - discount);

    o.appliedPromotionId = promo.id;
    o.appliedPromotionCode = promo.code;
    o.discountAmount = discount;
    o.total = newTotal;

    const next = [...arr];
    next[idx] = o;
    this._orders.set(next);

    // Propagate to financing for this quote
    this.financingSvc.syncFromOrderTotals(o.quoteId, newTotal);
  }

  /** Convenience: latest order total for a quote (by createdAt desc) */
  latestTotalForQuote(quoteId: string): number {
    const orders = this.listByQuote(quoteId);
    if (!orders.length) return 0;
    const latest = orders.slice().sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    return latest.total || 0;
  }
}
