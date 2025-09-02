import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { HogChartDirective } from '../../../shared/ui/chart/hog-chart.directive';

@Component({
  standalone: true,
  selector: 'hog-reports',
  imports: [CommonModule, MatCardModule, HogChartDirective],
  template: `
    <section class="page">
      <div class="header">
        <div>
          <div class="breadcrumb">Portal / Reports</div>
          <h1 class="title">Reports</h1>
          <div class="subtitle">At-a-glance performance (MVP demo)</div>
        </div>
      </div>

      <div class="charts">
        <mat-card class="chart mat-elevation-z1">
          <mat-card-header><mat-card-title>Sales by Store</mat-card-title></mat-card-header>
          <mat-card-content><div [hogChart]="byStore"></div></mat-card-content>
        </mat-card>
        <mat-card class="chart mat-elevation-z1">
          <mat-card-header><mat-card-title>Inventory Valuation</mat-card-title></mat-card-header>
          <mat-card-content><div [hogChart]="inventory"></div></mat-card-content>
        </mat-card>
        <mat-card class="chart mat-elevation-z1">
          <mat-card-header><mat-card-title>Service SLA</mat-card-title></mat-card-header>
          <mat-card-content><div [hogChart]="sla"></div></mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; gap:16px; }
    .header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
    .breadcrumb { font-size:12px; color:rgba(0,0,0,.54); }
    .title { font: 600 22px/1.2 system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial; margin:4px 0; }
    .subtitle { color:rgba(0,0,0,.54); font-size:13px }
    .charts { display:grid; gap:16px; grid-template-columns: repeat(12, 1fr); }
    .chart { grid-column: span 4; }
    @media (max-width: 1200px) { .chart { grid-column: span 6; } }
    @media (max-width: 700px) { .chart { grid-column: span 12; } }
  `]
})
export class ReportsPage {
  byStore = {
    chart: { type: 'bar', height: 260, toolbar: { show: false } },
    series: [{ data: [42, 33, 28] }],
    xaxis: { categories: ['Hartville HQ', 'Medina', 'Mentor'] },
    grid: { borderColor: '#eee' }
  };

  inventory = {
    chart: { type: 'area', height: 260, toolbar: { show: false } },
    series: [{ name: 'Valuation', data: [1.2, 1.3, 1.35, 1.28, 1.32, 1.4] }],
    xaxis: { categories: ['Mar','Apr','May','Jun','Jul','Aug'] },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    grid: { borderColor: '#eee' }
  };

  sla = {
    chart: { type: 'radialBar', height: 260, toolbar: { show: false } },
    series: [84],
    labels: ['Within 72h'],
  };
}
