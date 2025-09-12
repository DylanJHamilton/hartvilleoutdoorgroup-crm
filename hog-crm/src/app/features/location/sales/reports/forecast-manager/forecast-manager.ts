import { Component, Input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ForecastService, HorizonUnit } from '../../../../../shared/services/forecast.service';

type Timeframe = 'DTD'|'WTD'|'MTD'|'QTD'|'YTD'|'CUSTOM';
export interface DateRange { start: Date; end: Date; }

interface AttainmentRow {
  owner: string;
  target: number;
  actual: number;
  pct: number; // 0..100
}

@Component({
  standalone: true,
  selector: 'hog-forecast-manager',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './forecast-manager.html',
  styleUrls: ['./forecast-manager.scss'],
})
export class ForecastManagerComponent {
  private fc = inject(ForecastService);

  @Input({ required: true }) storeId!: string;
  @Input({ required: true }) timeframe!: Timeframe;
  @Input() range: DateRange | null = null;

  // Controls
  readonly horizon = signal<HorizonUnit>('Weeks');
  readonly horizonSize = signal<number>(8);    // 8 weeks by default
  readonly teamGoal = signal<number>(120_000);
  readonly seasonalityOn = signal<boolean>(true);

  // Series via shared service
  readonly projectedSeries = computed(() =>
    this.fc.projectedSeries(this.teamGoal(), this.horizonSize(), this.horizon(), this.seasonalityOn())
  );

  readonly actualSeries = computed(() =>
    this.fc.actualSeriesFromProjection(this.projectedSeries())
  );

  readonly categories = computed(() => {
    const len = this.projectedSeries().length;
    return Array.from({ length: len }, (_, i) =>
      this.horizon() === 'Weeks' ? `W${i+1}` : `P${i+1}`);
  });

  readonly cumulative = computed(() => ({
    proj: this.fc.cumulative(this.projectedSeries()),
    act:  this.fc.cumulative(this.actualSeries()),
  }));

  // Attainment (deterministic split)
  readonly attainment = computed<AttainmentRow[]>(() => {
    const totalTarget = this.teamGoal();
    const actualNow = this.cumulative().act.at(-1) ?? 0;
    const owners = ['rep-001','rep-002','rep-003'];
    const weights = [0.4, 0.35, 0.25];
    return owners.map((o, idx) => {
      const target = Math.round(totalTarget * weights[idx]);
      const drift  = (idx - 1) * 0.05;
      const actual = Math.max(0, Math.round(actualNow * (weights[idx] + drift)));
      const pct = Math.min(100, Math.round((actual / Math.max(1, target)) * 100));
      return { owner: o, target, actual, pct };
    });
  });

  currency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }
}
