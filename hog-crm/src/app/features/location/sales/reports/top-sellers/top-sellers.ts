import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { seedProductSales, DateRange } from '../../../../../mock/analytics.mock';

type Timeframe = 'DTD'|'WTD'|'MTD'|'QTD'|'YTD'|'CUSTOM';

@Component({
  standalone: true,
  selector: 'hog-top-sellers',
  imports: [CommonModule, MatCardModule],
  templateUrl: './top-sellers.html',
  styleUrls: ['./top-sellers.scss'],
})
export class TopSellersComponent {
  @Input({ required: true }) storeId!: string;
  @Input({ required: true }) timeframe!: Timeframe;
  @Input() range: DateRange | null = null;

  readonly data = computed(() => seedProductSales(this.storeId, this.range));
  readonly skus = computed(() => this.data().skus.slice(0, 8));
  readonly cats = computed(() => this.data().categories);

  totalCatRevenue() { return this.cats().reduce((s, c) => s + c.revenue, 0); }
  pct(n: number, d = this.totalCatRevenue()) { return d ? Math.round((n / d) * 100) : 0; }

  // Precompute conic-gradient string to avoid complex expressions in template
  readonly donutBg = computed(() => {
    const colors = ['#2563eb','#0ea5e9','#14b8a6','#f59e0b','#ef4444'];
    const total = this.totalCatRevenue();
    let start = 0;
    const segments: string[] = [];
    this.cats().forEach((c, i) => {
      const pct = total ? Math.round((c.revenue / total) * 100) : 0;
      const end = start + pct;
      const col = colors[i % colors.length];
      segments.push(`${col} ${start}% ${end}%`);
      start = end;
    });
    return `conic-gradient(${segments.join(',')})`;
  });

  currency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }
}
