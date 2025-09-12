import { Component, Input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { ForecastService } from '../../../../../shared/services/forecast.service';

type Timeframe = 'DTD'|'WTD'|'MTD'|'QTD'|'YTD'|'CUSTOM';
export interface DateRange { start: Date; end: Date; }

@Component({
  standalone: true,
  selector: 'hog-forecast-rep',
  imports: [CommonModule, MatCardModule, MatCheckboxModule, MatListModule],
  templateUrl: './forecast-rep.html',
  styleUrls: ['./forecast-rep.scss'],
})
export class ForecastRepComponent {
  private fc = inject(ForecastService);

  @Input({ required: true }) userId!: string;
  @Input({ required: true }) storeId!: string;
  @Input({ required: true }) timeframe!: Timeframe;
  @Input() range: DateRange | null = null;

  // Display only (service uses 2500 default too)
  readonly avgDeal = 2500;

  // Simplified personal goal & progress (could come from service later)
  readonly myGoal = signal<number>(40_000);
  readonly myActual = signal<number>(31_500);

  readonly attainmentPct = computed(() =>
    Math.min(100, Math.round((this.myActual() / Math.max(1, this.myGoal())) * 100))
  );
  readonly gap = computed(() => Math.max(0, this.myGoal() - this.myActual()));
  readonly winsNeeded = computed(() => Math.ceil(this.gap() / this.avgDeal));

  // Levers from shared service (uses defaults: avgDeal=2500, base rates)
  readonly levers = computed(() =>
    this.fc.levers(this.myGoal(), this.myActual())
  );

  // Weekly checklist (in-memory)
  readonly checklist = signal([
    { id: 'wk-call-1', label: 'Make 15 calls', done: false },
    { id: 'wk-appt-1', label: 'Set 4 appointments', done: false },
    { id: 'wk-quote-1', label: 'Send 3 quotes', done: false },
  ]);

  toggle(id: string, checked: boolean) {
    this.checklist.update(items => items.map(i => i.id === id ? { ...i, done: checked } : i));
  }
}
