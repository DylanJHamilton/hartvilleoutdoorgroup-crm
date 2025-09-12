import { QuoteItem, QuoteStatus, QuoteLine } from '../types/sales/quote/quotes.types';

function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const owners = [
  { id: 'u1', name: 'Alex Admin' },
  { id: 'u2', name: 'Sally Sales' },
  { id: 'u3', name: 'Mark Manager' },
];

const customers = ['Smith Family','ACME Corp','Baker Homes','Lakeside HOA','Green Acres LLC','Miller Group'];
const skus = [
  { sku:'KIT-DOOR-01', name:'Premium Door Kit', price: 1299 },
  { sku:'KIT-FENCE-04', name:'Composite Fence Pack', price: 1899 },
  { sku:'KIT-DECK-06', name:'Deck Board Bundle', price: 2599 },
  { sku:'ACC-HRD-12', name:'Hardware Set', price: 199 },
];

export const QUOTE_OWNERS = owners;

export function seedQuotes(count = 24, seed = 101): QuoteItem[] {
  const rnd = mulberry32(seed);
  const statuses: QuoteStatus[] = ['Draft','Sent','Accepted','Rejected'];

  const items: QuoteItem[] = [];
  for (let i = 0; i < count; i++) {
    const owner = owners[Math.floor(rnd()*owners.length)];
    const cust = customers[Math.floor(rnd()*customers.length)];
    const status = statuses[Math.floor(rnd()*statuses.length)];
    const lineCount = 1 + Math.floor(rnd()*3);

    const lines: QuoteLine[] = [];
    let subtotal = 0;
    let discounts = 0;

    for (let j = 0; j < lineCount; j++) {
      const p = skus[Math.floor(rnd()*skus.length)];
      const qty = 1 + Math.floor(rnd()*3);
      const discountPct = rnd() < 0.25 ? 10 : 0;
      const extended = qty * p.price * (1 - discountPct/100);
      lines.push({
        sku: p.sku, name: p.name, qty, unitPrice: p.price,
        discountPct: discountPct || undefined, extended: Math.round(extended)
      });
      subtotal += p.price * qty;
      discounts += (p.price * qty) - extended;
    }

    const tax = Math.round((subtotal - discounts) * 0.065);
    const total = Math.round(subtotal - discounts + tax);
    const now = Date.now();
    const days = Math.floor(rnd()*20) - 10;
    const updatedAt = new Date(now + days*86400000).toISOString();
    const createdAt = new Date(new Date(updatedAt).getTime() - 2*86400000).toISOString();

    items.push({
      id: `q_${i+1}`,
      quoteNumber: `Q-2025-${String(1000+i)}`,
      customer: cust,
      ownerId: owner.id,
      ownerName: owner.name,
      status,
      createdAt,
      updatedAt,
      items: lines,
      subtotal: Math.round(subtotal),
      discounts: Math.round(discounts),
      tax,
      total,
      notes: ''
    });
  }
  return items;
}
