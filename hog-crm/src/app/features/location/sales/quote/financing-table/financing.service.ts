import { Injectable, signal } from '@angular/core';
import { FinancingApp } from '../../../../../types/sales/quote/financing.types';
import { seedFinancing } from '../../../../../mock/financing.mock';
import { QuotesService } from '../quotes.service';

@Injectable({ providedIn: 'root' })
export class FinancingService {
  private _apps = signal<FinancingApp[]>([]);

  constructor(private quotesSvc: QuotesService) {
    // seed once from current quotes
    this._apps.set(seedFinancing(this.quotesSvc.all(), 333));
  }

  listByQuote(quoteId: string) {
    return this._apps().filter(a => a.quoteId === quoteId);
  }

  upsert(app: FinancingApp) {
    const arr = this._apps();
    const i = arr.findIndex(x => x.id === app.id);
    this._apps.set(i >= 0 ? arr.map(x => x.id === app.id ? app : x) : [app, ...arr]);
  }

  delete(id: string) {
    this._apps.set(this._apps().filter(a => a.id !== id));
  }

  /**
   * When an order total changes (e.g., promo applied), keep financing amounts in sync.
   * If an app has 'downPayment', compute amountFinanced = latestTotal - downPayment (clamped at 0).
   * If 'termMonths' exists, compute a simple estimatedMonthly.
   */
  syncFromOrderTotals(quoteId: string, latestOrderTotal: number) {
    const updated = this._apps().map(app => {
      if (app.quoteId !== quoteId) return app;
      const a: any = { ...app };

      const down = typeof a.downPayment === 'number' ? a.downPayment : 0;
      a.amountFinanced = Math.max(0, (latestOrderTotal || 0) - down);

      if (typeof a.termMonths === 'number' && a.termMonths > 0) {
        a.estimatedMonthly = Math.round(a.amountFinanced / a.termMonths);
      }

      return a;
    });
    this._apps.set(updated);
  }
}