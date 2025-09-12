export type FinancingStatus = 'Pending' | 'Approved' | 'Declined' | 'Funded';

export interface FinancingApp {
  id: string;                // f_*
  quoteId: string;
  quoteNumber: string;
  customer: string;
  provider: string;          // e.g., Synchrony, Wells Fargo
  applicationNumber: string; // external ref
  status: FinancingStatus;
  ownerId: string; ownerName: string;
  notes?: string;
  createdAt: string; updatedAt: string;
}
