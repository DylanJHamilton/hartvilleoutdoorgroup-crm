export type OpportunityStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Nurturing'
  | 'Closed Won'
  | 'Closed Lost';

export interface Opportunity {
  id: string;
  customer: string;
  title: string;
  pipeline: string;
  status: OpportunityStatus;
  owner?: string;
  value: number;
  ageDays: number;
  source: string;
  duplicate?: boolean;
}
