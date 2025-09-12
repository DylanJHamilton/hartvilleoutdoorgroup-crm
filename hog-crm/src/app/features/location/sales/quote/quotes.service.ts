import { Injectable, signal } from '@angular/core';
import { QuoteItem } from '../../../../types/sales/quote/quotes.types';
import { seedQuotes, QUOTE_OWNERS } from '../../../../mock/quotes.mock';

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private _seq = signal(2000);
  private _quotes = signal<QuoteItem[]>(seedQuotes(28, 151));
  owners = QUOTE_OWNERS;

  all() { return this._quotes(); }
  byId(id: string) { return this._quotes().find(q => q.id === id) ?? null; }

  upsert(q: QuoteItem) {
    const arr = this._quotes();
    const i = arr.findIndex(x => x.id === q.id);
    this._quotes.set(i >= 0 ? arr.map(x => x.id === q.id ? q : x) : [q, ...arr]);
  }

  remove(id: string) {
    this._quotes.set(this._quotes().filter(q => q.id !== id));
  }

  nextId() { const next = this._seq() + 1; this._seq.set(next); return `q_${next}`; }

  createDraft(customer: string, ownerId: string, ownerName: string): QuoteItem {
    const next = this._seq() + 1; this._seq.set(next);
    const now = new Date().toISOString();
    const q: QuoteItem = {
      id: `q_${next}`,
      quoteNumber: `Q-2025-${next}`,
      customer,
      ownerId,
      ownerName,
      status: 'Draft',
      createdAt: now,
      updatedAt: now,
      items: [],
      subtotal: 0,
      discounts: 0,
      tax: 0,
      total: 0,
      notes: ''
    };
    this.upsert(q);
    return q;
  }

  /** Optional totals recompute if items change later */
  recomputeTotals(q: QuoteItem): QuoteItem {
    const subtotal = q.items.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const extended = q.items.reduce((s, l) => s + l.extended, 0);
    const discounts = subtotal - extended;
    const tax = Math.round(extended * 0.065);
    const total = extended + tax;
    return { ...q, subtotal: Math.round(subtotal), discounts: Math.round(discounts), tax, total, updatedAt: new Date().toISOString() };
  }
}