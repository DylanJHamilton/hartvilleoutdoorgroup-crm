import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrgSummary } from './protal.types';
import { API_BASE_URL } from '../../../core/config/app-tokens';
import { delay, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PortalApi {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  // Replace stub with real call when backend is ready
  getOrgSummary(orgId: string) {
    const mock: OrgSummary = {
      orgId,
      orgName: 'Hartville Outdoor Group',
      period: 'month',
      kpis: [
        { label: 'Total Sales', value: 182, delta: 12 },
        { label: 'Revenue', value: '$1.26M', delta: 8 },
        { label: 'Avg Deal Size', value: '$6,930', delta: -3 },
        { label: 'Open Tickets', value: 47, delta: 5 }
      ]
    };
    return of(mock).pipe(delay(300));
    // return this.http.get<OrgSummary>(`${this.base}/portal/${orgId}/summary`);
  }
}
