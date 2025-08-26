import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';

@Component({
  standalone: true,
  selector: 'hog-dash-inventory',
  imports: [CommonModule, MatCardModule, MatIconModule, NgApexchartsModule, StatCardComponent],
  template: `
    <div class="grid12">
      <hog-stat-card class="span3" label="On Hand" [value]="1250" [delta]="3" icon="inventory_2"></hog-stat-card>
      <hog-stat-card class="span3" label="Low Stock" [value]="42" [delta]="-6" icon="warning"></hog-stat-card>
      <hog-stat-card class="span3" label="Avg Days Supply" [value]="28" [delta]="2" icon="calendar_month"></hog-stat-card>
      <hog-stat-card class="span3" label="Inbound" [value]="180" [delta]="4" icon="local_shipping"></hog-stat-card>

      <mat-card class="span8">
        <mat-card-header><mat-card-title>Stock Levels (Top 6)</mat-card-title></mat-card-header>
        <mat-card-content>
          <apx-chart
            [chart]="chartBar"
            [series]="seriesQty"
            [xaxis]="xaxisCats"
            [plotOptions]="plotBar45">
          </apx-chart>
        </mat-card-content>
      </mat-card>

      <mat-card class="span4">
        <mat-card-header><mat-card-title>Turnover</mat-card-title></mat-card-header>
        <mat-card-content>
          <apx-chart
            [chart]="chartRadial"
            [series]="seriesTurns"
            [labels]="labelsTurns">
          </apx-chart>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .grid12 { display:grid; gap:16px; grid-template-columns:repeat(12,1fr); align-items:start; }
    .span3 { grid-column: span 3; }
    .span4 { grid-column: span 4; }
    .span8 { grid-column: span 8; }
    @media (max-width: 959px) { .span3, .span4, .span8 { grid-column: span 12; } }
  `]
})
export class DashInventoryPage {
  chartBar: any = { type: 'bar', height: 260 };
  seriesQty: any = [{ name: 'Qty', data: [320,260,220,200,180,150] }];
  xaxisCats: any = { categories: ['Sheds','Garages','Cabins','Barns','Carts','Trailers'] };
  plotBar45: any = { bar: { columnWidth: '45%' } };

  chartRadial: any = { type: 'radialBar', height: 260 };
  seriesTurns: any = [64];
  labelsTurns: any = ['Turns/Yr'];
}
