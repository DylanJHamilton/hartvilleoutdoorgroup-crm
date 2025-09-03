export interface BasePerformance {
  userId: string;
  period: string;            // e.g., '2025-Q3'
  overallScore?: number;

  // Manager-editable (applies to all roles) — OPTIONAL here
  onTimeRate?: number;       // %
  attitudeScore?: number;    // 1–5
  coachingNotes?: string;    // long text
}

/* MANAGERS */
export interface ManagerPerformance extends BasePerformance {
  storeSales: number;
  staffMorale: number;          // 1–5
  inventoryAccuracy: number;    // %
  operationalUpkeep: number;    // %
  communityEngagement: number;  // 1–5
  goalExecution: number;        // 1–5
}

/* SALES — NOTICE: no onTimeRate here anymore */
export interface SalesPerformance extends BasePerformance {
  totalSales: number;           // $
  closeRatio: number;           // %
  salesCycleDays: number;
  followUpAvg: number;
  repeatRate: number;           // %
}

/* CUSTOMER SERVICE */
export interface CustomerServicePerformance extends BasePerformance {
  firstResponseMins: number;
  resolutionMins: number;
  csat: number;                 // %
  contactsHandled: number;
  escalationRate: number;       // %
}

/* SERVICE TECHS */
export interface ServicePerformance extends BasePerformance {
  unitsServiced: number;
  avgServiceMins: number;
  firstTimeFixRate: number;     // %
  repeatIssueRate: number;      // %
  csat: number;                 // %
  safetyIncidents: number;
}

/* DELIVERY */
export interface DeliveryPerformance extends BasePerformance {
  avgDeliveryMins: number;
  efficiency: number;           // deliveries/hour
  csat: number;                 // %
  damageRate: number;           // %
  safetyIncidents: number;
}

/* RENTALS */
export interface RentalsPerformance extends BasePerformance {
  rentalVolume: number;
  rentalRevenue: number;
  conversionRate: number;       // %
  utilizationRate: number;      // %
  repeatRentalRate: number;     // %
}

export type Performance =
  | ManagerPerformance
  | SalesPerformance
  | CustomerServicePerformance
  | ServicePerformance
  | DeliveryPerformance
  | RentalsPerformance;
