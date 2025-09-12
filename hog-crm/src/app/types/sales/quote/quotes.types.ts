export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected';

export interface QuoteLine {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;   // base price
  discountPct?: number; // promo/manager override
  extended: number;    // computed
}

export interface QuoteItem {
  id: string;             // q_*
  quoteNumber: string;    // e.g., Q-2025-00123
  customer: string;
  ownerId: string;
  ownerName: string;
  status: QuoteStatus;
  createdAt: string;      // ISO
  updatedAt: string;      // ISO
  items: QuoteLine[];
  subtotal: number;
  discounts: number;      // total discount $
  tax: number;
  total: number;
  notes?: string;
}
