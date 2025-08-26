export interface OrgKpi {
  label: string;
  value: number | string;
  delta?: number; // %
}

export interface OrgSummary {
  orgId: string;
  orgName: string;
  period: 'today'|'week'|'month'|'quarter'|'year';
  kpis: OrgKpi[];
}
