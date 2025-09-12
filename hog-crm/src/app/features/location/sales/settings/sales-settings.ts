import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

type Timeframe = 'DTD'|'WTD'|'MTD'|'QTD'|'YTD';
type SelfReportScope = 'self' | 'team' | 'store';
type RepTabKey = 'myPerformance' | 'forecast' | 'topSellers' | 'selfReports';

interface SalesSettings {
  repTabs: Record<RepTabKey, boolean>;
  selfReports: {
    allowExport: boolean;
    scope: SelfReportScope;
  };
  privacy: {
    maskRevenue: boolean;
  };
  kpis: {
    showCloseRatio: boolean;
    showAvgDeal: boolean;
  };
  forecast: {
    seasonalityDefault: boolean;
    avgDeal: number;
    defaultGoalPerRep: number;
    rates: {
      callToAppt: number;
      apptToQuote: number;
      quoteToWin: number;
    };
  };
  defaults: {
    timeframe: Timeframe;
  };
}

const STORAGE_KEY = 'hog.sales.settings';

const DEFAULT_SETTINGS: SalesSettings = {
  repTabs: {
    myPerformance: true,
    forecast: true,
    topSellers: true,
    selfReports: true,
  },
  selfReports: {
    allowExport: true,
    scope: 'self',
  },
  privacy: {
    maskRevenue: false,
  },
  kpis: {
    showCloseRatio: true,
    showAvgDeal: true,
  },
  forecast: {
    seasonalityDefault: true,
    avgDeal: 2500,
    defaultGoalPerRep: 40000,
    rates: { callToAppt: 0.25, apptToQuote: 0.6, quoteToWin: 0.35 },
  },
  defaults: { timeframe: 'MTD' },
};

@Component({
  standalone: true,
  selector: 'hog-sales-settings',
  imports: [
    CommonModule,
    MatCardModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './sales-settings.html',
  styleUrls: ['./sales-settings.scss'],
})
export class SalesSettingsComponent {
  /** Gate editing with your AuthService: <hog-sales-settings [canEdit]="auth.isManagerOrAdmin$ | async"></hog-sales-settings> */
  @Input() canEdit = true;

  readonly settings = signal<SalesSettings>(this.load());
  private _snapshot = JSON.stringify(this.settings());
  readonly isDirty = computed(() => JSON.stringify(this.settings()) !== this._snapshot);
  readonly savedFlash = signal(false);

  // Select options
  timeframeList: Timeframe[] = ['DTD','WTD','MTD','QTD','YTD'];
  scopeList: {label:string, value: SelfReportScope}[] = [
    { label: 'Self only', value: 'self' },
    { label: 'Team', value: 'team' },
    { label: 'Store', value: 'store' },
  ];

  // --------- Update helpers (no lambdas in template) ----------
  toggleRepTab(tab: RepTabKey, checked: boolean) {
    this.settings.update(s => ({ ...s, repTabs: { ...s.repTabs, [tab]: checked } }));
  }
  setSelfReportScope(scope: SelfReportScope) {
    this.settings.update(s => ({ ...s, selfReports: { ...s.selfReports, scope } }));
  }
  setAllowExport(checked: boolean) {
    this.settings.update(s => ({ ...s, selfReports: { ...s.selfReports, allowExport: checked } }));
  }
  setMaskRevenue(checked: boolean) {
    this.settings.update(s => ({ ...s, privacy: { ...s.privacy, maskRevenue: checked } }));
  }
  setSeasonality(checked: boolean) {
    this.settings.update(s => ({ ...s, forecast: { ...s.forecast, seasonalityDefault: checked } }));
  }
  setAvgDeal(val: number) {
    this.settings.update(s => ({ ...s, forecast: { ...s.forecast, avgDeal: Math.max(0, +val || 0) } }));
  }
  setDefaultGoalPerRep(val: number) {
    this.settings.update(s => ({ ...s, forecast: { ...s.forecast, defaultGoalPerRep: Math.max(0, +val || 0) } }));
  }
  setRate(key: keyof SalesSettings['forecast']['rates'], val: number) {
    const v = Math.min(1, Math.max(0, +val || 0));
    this.settings.update(s => ({ ...s, forecast: { ...s.forecast, rates: { ...s.forecast.rates, [key]: v } } }));
  }
  setDefaultTimeframe(tf: Timeframe) {
    this.settings.update(s => ({ ...s, defaults: { ...s.defaults, timeframe: tf } }));
  }
  setKpiCloseRatio(checked: boolean) {
    this.settings.update(s => ({ ...s, kpis: { ...s.kpis, showCloseRatio: checked } }));
  }
  setKpiAvgDeal(checked: boolean) {
    this.settings.update(s => ({ ...s, kpis: { ...s.kpis, showAvgDeal: checked } }));
  }

  // --------- Persistence ----------
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings()));
      this._snapshot = JSON.stringify(this.settings());
      this.savedFlash.set(true);
      setTimeout(() => this.savedFlash.set(false), 1200);
    } catch {}
  }
  reset() {
    this.settings.set(structuredClone(DEFAULT_SETTINGS));
  }
  private load(): SalesSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_SETTINGS);
      const parsed = JSON.parse(raw) as Partial<SalesSettings>;
      return {
        ...structuredClone(DEFAULT_SETTINGS),
        ...parsed,
        repTabs: { ...DEFAULT_SETTINGS.repTabs, ...(parsed as any).repTabs },
        selfReports: { ...DEFAULT_SETTINGS.selfReports, ...(parsed as any).selfReports },
        privacy: { ...DEFAULT_SETTINGS.privacy, ...(parsed as any).privacy },
        kpis: { ...DEFAULT_SETTINGS.kpis, ...(parsed as any).kpis },
        forecast: {
          ...DEFAULT_SETTINGS.forecast,
          ...(parsed as any).forecast,
          rates: { ...DEFAULT_SETTINGS.forecast.rates, ...((parsed as any).forecast?.rates ?? {}) }
        },
        defaults: { ...DEFAULT_SETTINGS.defaults, ...(parsed as any).defaults },
      };
    } catch {
      return structuredClone(DEFAULT_SETTINGS);
    }
  }
}
