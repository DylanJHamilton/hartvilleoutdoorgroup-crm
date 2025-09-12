// Pure types (no Angular deps)
export type TF = 'DTD'|'WTD'|'MTD'|'QTD'|'YTD';
export type Stage = 'Lead'|'Qualified'|'Quoted'|'Won'|'Lost';

export interface SalesCardData {
  id: string;
  title: string;
  customer: string;
  pipeline: string;
  stage: Stage;
  value: number;     // USD
  owner: string;
  phone?: string;
  email?: string;
  ageDays?: number;
}
