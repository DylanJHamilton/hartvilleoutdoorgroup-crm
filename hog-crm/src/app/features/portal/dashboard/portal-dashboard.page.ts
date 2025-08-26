// features/portal/dashboard/portal-dashboard.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StatCardComponent } from '../../../shared/ui/stat-card/stat-card.component';

@Component({
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, StatCardComponent],
  template: `
    <div style="display:grid;gap:16px;grid-template-columns:repeat(12,1fr)">
      <hog-stat-card *ngFor="let k of kpis" style="grid-column:span 3"
        [label]="k.label" [value]="k.value" [delta]="k.delta"></hog-stat-card>

      <apx-chart style="grid-column:span 8"
        [chart]="{ type: 'line', height: 260 }"
        [title]="{ text: 'Sales (Last 12 weeks)' }"
        [series]="[{ name:'Sales', data:[12,14,18,16,22,25,28,26,30,34,32,38] }]"
        [xaxis]="{ categories:['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'] }">
      </apx-chart>

      <apx-chart style="grid-column:span 4"
        [chart]="{ type: 'pie', height: 260 }"
        [title]="{ text: 'By Pipeline' }"
        [series]="[44,33,23]"
        [labels]="['Sheds/Barns','Golf Carts','Play/Rentals']">
      </apx-chart>
    </div>
  `
})
export class PortalDashboardPage implements OnInit {
  kpis = [
    { label: 'Total Sales',  value: 182,   delta: 12 },
    { label: 'Revenue',      value: '$1.26M', delta: 8 },
    { label: 'Avg Deal',     value: '$6,930', delta: -3 },
    { label: 'Open Tickets', value: 47,    delta: 5 }
  ];
  ngOnInit() {}
}
