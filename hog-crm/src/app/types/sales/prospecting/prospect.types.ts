// src/app/types/sales/prospecting/prospecting.types.ts
import { OpportunityStatus } from "./opportunity.types";

/**
 * Represents a single prospect / opportunity record
 * before it becomes a pipeline deal.
 */
export interface ProspectOpportunity {
  id: string;
  customer: string;
  title: string;
  pipeline: string;
  status: OpportunityStatus;
  owner?: string;
  value: number;      // estimated $ value
  ageDays: number;    // age of record
  source: string;     // Website, Referral, Ads, etc.
  duplicate?: boolean;
}

/**
 * Represents a named batch of prospects
 * usually from an import or a marketing campaign.
 */
export interface ProspectList {
  id: string;
  name: string;
  owner?: string;
  source: string;     // e.g. CSV, Tradeshow, Google Ads
  count: number;      // # of rows in the list
  createdAt: string;  // ISO timestamp
  updatedAt: string;  // ISO timestamp
}
