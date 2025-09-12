// src/app/features/location/sales/quote/promotions/promotions.service.ts
import { Injectable, signal } from '@angular/core';
import { seedPromotions, PROMO_CATEGORIES } from '../../../../../mock/promotions.mock';

export type PromotionStatus = 'Active' | 'Scheduled' | 'Expired';
export interface Promotion {
  id: string;
  name: string;
  code: string;
  discountType: 'Percent' | 'Amount';
  discountValue: number;    // 10 => 10% or $10 based on discountType
  startDate: string;        // ISO
  endDate: string;          // ISO
  categories: string[];     // e.g. ['Grills', 'Patio']
  eligibleSkus: string[];   // sample SKUs
  stackable: boolean;
  approvalRequired: boolean;
  notes?: string;
}
@Injectable({ providedIn: 'root' })
export class PromotionsService {
  private _promos = signal<Promotion[]>(seedPromotions(28));
  categories = PROMO_CATEGORIES;

  all() { return this._promos(); }

  statusFor(p: Promotion, now = new Date()): PromotionStatus {
    const s = new Date(p.startDate), e = new Date(p.endDate);
    if (now < s) return 'Scheduled';
    if (now > e) return 'Expired';
    return 'Active';
  }

  // convenience filters
  active(now = new Date()) { return this._promos().filter(p => this.statusFor(p, now) === 'Active'); }
  scheduled(now = new Date()) { return this._promos().filter(p => this.statusFor(p, now) === 'Scheduled'); }
  expired(now = new Date()) { return this._promos().filter(p => this.statusFor(p, now) === 'Expired'); }
}
