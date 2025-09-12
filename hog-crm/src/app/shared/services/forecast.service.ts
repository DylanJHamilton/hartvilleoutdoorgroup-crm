import { Injectable } from '@angular/core';

export type HorizonUnit = 'Weeks' | 'Months';

@Injectable({ providedIn: 'root' })
export class ForecastService {
  projectedSeries(teamGoal: number, size: number, unit: HorizonUnit, seasonality = true): number[] {
    const len = unit === 'Weeks' ? size : size * 4;
    const base = Math.max(1, Math.floor(teamGoal / len));
    const arr: number[] = [];
    for (let i = 0; i < len; i++) {
      const bump = seasonality ? (1 + 0.15 * Math.sin(i / 2)) : 1;
      arr.push(Math.round(base * bump));
    }
    return arr;
  }

  actualSeriesFromProjection(proj: number[]): number[] {
    return proj.map((v, i) => Math.round(v * (0.85 + 0.02 * i)));
  }

  cumulative(series: number[]) {
    const out: number[] = []; let acc = 0;
    for (const v of series) { acc += v; out.push(acc); }
    return out;
  }

  // Rep “levers”
  levers(goal: number, actual: number, avgDeal = 2500, rates = { callToAppt: 0.25, apptToQuote: 0.6, quoteToWin: 0.35 }) {
    const gap = Math.max(0, goal - actual);
    const wins = Math.ceil(gap / Math.max(1, avgDeal));
    const quotes = Math.ceil(wins / Math.max(0.01, rates.quoteToWin));
    const appts  = Math.ceil(quotes / Math.max(0.01, rates.apptToQuote));
    const calls  = Math.ceil(appts  / Math.max(0.01, rates.callToAppt));
    return { gap, winsNeeded: wins, callsNeeded: calls, apptsNeeded: appts, quotesNeeded: quotes };
  }
}
