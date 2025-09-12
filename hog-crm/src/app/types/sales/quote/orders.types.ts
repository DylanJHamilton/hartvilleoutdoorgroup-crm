export type FulfillmentStatus = 'Pending' | 'In Progress' | 'Fulfilled' | 'Canceled';

export interface OrderLine {
  sku: string; name: string; qty: number; unitPrice: number; extended: number;
}

export interface OrderItem {
  id: string;              // o_*
  orderNumber: string;     // e.g., SO-2025-00456
  quoteId: string;         // q_*
  quoteNumber: string;
  items: OrderLine[];
  subtotal: number; tax: number; total: number;
  status: FulfillmentStatus;
  createdAt: string; updatedAt: string;
}
