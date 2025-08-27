import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { HogChartDirective } from '../../../shared/ui/chart/hog-chart.directive';

@Component({
  standalone: true,
  selector: 'hog-portal-dashboard',
  imports: [CommonModule, MatCardModule, HogChartDirective],
  template: `
    <div style="display:grid;gap:16px;grid-template-columns:repeat(12,1fr)">
      <mat-card style="grid-column:span 8">
        <mat-card-header><mat-card-title>Sales (Last 12 weeks)</mat-card-title></mat-card-header>
        <mat-card-content><div [hogChart]="lineOptions"></div></mat-card-content>
      </mat-card>

      <mat-card style="grid-column:span 4">
        <mat-card-header><mat-card-title>By Pipeline</mat-card-title></mat-card-header>
        <mat-card-content><div [hogChart]="pieOptions"></div></mat-card-content>
      </mat-card>
    </div>
  `
})
export class PortalDashboardPage {
  lineOptions: any = {
    chart: { type: 'line', height: 260, toolbar: { show: false } },
    series: [{ name: 'Sales', data: [12,14,18,16,22,25,28,26,30,34,32,38] }],
    xaxis: { categories: ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'] },
    stroke: { curve: 'smooth', width: 3 },
    grid: { strokeDashArray: 4 }
  };

  pieOptions: any = {
    chart: { type: 'pie', height: 260 },
    series: [44,33,23],
    labels: ['Sheds/Barns','Golf Carts','Play/Rentals']
  };
}
