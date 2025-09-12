import { OrderItem, OrderLine, FulfillmentStatus } from '../types/sales/quote/orders.types';
import { QuoteItem } from '../types/sales/quote/quotes.types';

function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function orderFromQuote(q: QuoteItem, seq: number): OrderItem {
  const lines: OrderLine[] = q.items.map(l => ({
    sku: l.sku, name: l.name, qty: l.qty, unitPrice: l.unitPrice, extended: l.extended
  }));
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const tax = Math.round((subtotal) * 0.065);
  const total = subtotal + tax;
  const now = new Date().toISOString();

  return {
    id: `o_${seq}`,
    orderNumber: `SO-2025-${String(5000+seq)}`,
    quoteId: q.id,
    quoteNumber: q.quoteNumber,
    items: lines,
    subtotal, tax, total,
    status: 'Pending' as FulfillmentStatus,
    createdAt: now, updatedAt: now
  };
}

export function seedOrders(fromQuotes: QuoteItem[], seed = 202): OrderItem[] {
  const rnd = mulberry32(seed);
  const statuses: FulfillmentStatus[] = ['Pending','In Progress','Fulfilled','Canceled'];
  const orders: OrderItem[] = [];
  let seq = 1;

  fromQuotes.slice(0, Math.min(10, fromQuotes.length)).forEach(q => {
    if (rnd() < 0.7) {
      const base = orderFromQuote(q, seq++);
      base.status = statuses[Math.floor(rnd()*statuses.length)];
      orders.push(base);
    }
  });
  return orders;
}
