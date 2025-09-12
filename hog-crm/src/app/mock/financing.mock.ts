import { FinancingApp, FinancingStatus } from '../types/sales/quote/financing.types';
import { QuoteItem } from '../types/sales/quote/quotes.types';

function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const providers = ['Synchrony','Wells Fargo','Ally','GreenSky'];

export function seedFinancing(fromQuotes: QuoteItem[], seed = 303): FinancingApp[] {
  const rnd = mulberry32(seed);
  const statuses: FinancingStatus[] = ['Pending','Approved','Declined','Funded'];
  const apps: FinancingApp[] = [];
  let seq = 1;

  fromQuotes.slice(0, Math.min(12, fromQuotes.length)).forEach(q => {
    if (rnd() < 0.6) {
      const provider = providers[Math.floor(rnd()*providers.length)];
      const status = statuses[Math.floor(rnd()*statuses.length)];
      const now = new Date().toISOString();
      apps.push({
        id: `f_${seq++}`,
        quoteId: q.id,
        quoteNumber: q.quoteNumber,
        customer: q.customer,
        provider,
        applicationNumber: `${provider.slice(0,2).toUpperCase()}-${Math.floor(rnd()*9_000_000+1_000_000)}`,
        status,
        ownerId: q.ownerId,
        ownerName: q.ownerName,
        notes: '',
        createdAt: now, updatedAt: now
      });
    }
  });

  return apps;
}
