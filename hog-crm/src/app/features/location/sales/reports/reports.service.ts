import { Injectable, signal } from '@angular/core';

export type Timeframe = 'DTD' | 'WTD' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM';
export interface DateRange { start: Date; end: Date; }
export interface Kpis {
  dealsClosed: number; dealsClosedStr: string;
  totalRevenue: number; totalRevenueStr: string; revenueDeltaPct: number;
  avgDealSize: number; avgDealSizeStr: string;
  closeRatio: number; closeRatioStr: string;
  pipelineValue: number; pipelineValueStr: string; pipelineDeltaPct: number;
  activities: { calls: number; appointments: number; emails: number };
  activitiesStr: string; activitiesDeltaPct: number;
  dealsDeltaPct: number;
}
export interface Charts {
  revenue: number[]; deals: number[];
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private version = signal(0);

  bumpVersion() { this.version.update(v => v + 1); }

  storeName(storeId: string): string {
    // Replace with real store lookup later
    const map: Record<string,string> = { mentor: 'Mentor', hartville: 'Hartville', akron: 'Akron' };
    return map[storeId] ?? (storeId?.toUpperCase() || 'STORE');
  }

  getKpis(opts: {
    storeId: string;
    ownerId?: string;                   // undefined => store scope; defined => owner scope
    timeframe: Timeframe;
    range: DateRange | null;
  }): Kpis {
    const seedKey = [
      'kpi', opts.storeId, opts.ownerId ?? 'ALL',
      opts.timeframe, opts.range?.start?.toISOString() ?? '', opts.range?.end?.toISOString() ?? '',
      this.version()
    ].join('|');
    const rnd = this.seeded(seedKey);

    const deals = 20 + Math.floor(rnd() * 35);           // 20..55
    const aov = 1800 + Math.floor(rnd() * 3200);         // $1.8k..$5k
    const totalRevenue = deals * aov;
    const pipeline = Math.floor(totalRevenue * (1.6 + rnd())); // ~1.6×..2.6×
    const closeRatio = 18 + Math.floor(rnd() * 22);      // 18–40%
    const calls = 60 + Math.floor(rnd() * 120);
    const appts = 8 + Math.floor(rnd() * 22);
    const emails = 40 + Math.floor(rnd() * 100);

    const revDelta = Math.floor(rnd() * 21) - 10;        // -10..+10
    const dealsDelta = Math.floor(rnd() * 21) - 10;
    const pipelineDelta = Math.floor(rnd() * 21) - 10;
    const actsDelta = Math.floor(rnd() * 21) - 10;

    return {
      dealsClosed: deals,
      dealsClosedStr: `${deals}`,
      totalRevenue,
      totalRevenueStr: this.usd(totalRevenue),
      revenueDeltaPct: revDelta,
      avgDealSize: aov,
      avgDealSizeStr: this.usd(aov),
      closeRatio,
      closeRatioStr: `${closeRatio}%`,
      pipelineValue: pipeline,
      pipelineValueStr: this.usd(pipeline),
      pipelineDeltaPct: pipelineDelta,
      activities: { calls, appointments: appts, emails },
      activitiesStr: `${calls + appts + emails}`,
      activitiesDeltaPct: actsDelta,
      dealsDeltaPct: dealsDelta,
    };
  }

  getCharts(opts: {
    storeId: string;
    ownerId?: string;
    timeframe: Timeframe;
    range: DateRange | null;
  }): Charts {
    const seedKey = ['series', opts.storeId, opts.ownerId ?? 'ALL', opts.timeframe, this.version()].join('|');
    const rnd = this.seeded(seedKey);
    const N = 12;
    const revenue = Array.from({ length: N }, () => 2000 + Math.floor(rnd() * 6000));
    const deals   = Array.from({ length: N }, () => 5 + Math.floor(rnd() * 12));
    return { revenue, deals };
  }

  // ——— helpers ———
  private usd(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }

  private seeded(seedStr: string) {
    // FNV-1a hash + xorshift mix (deterministic)
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += 0x6D2B79F5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
