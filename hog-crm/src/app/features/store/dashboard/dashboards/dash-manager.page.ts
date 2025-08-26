import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';

@Component({
  standalone: true,
  selector: 'hog-dash-manager',
  imports: [CommonModule, MatCardModule, MatIconModule, NgApexchartsModule, StatCardComponent],
  template: `
    <div class="grid12">
      <hog-stat-card class="span3" label="Open Tasks" [value]="72" [delta]="-5" icon="assignment"></hog-stat-card>
      <hog-stat-card class="span3" label="Teams" [value]="6" [delta]="0" icon="diversity_3"></hog-stat-card>
      <hog-stat-card class="span3" label="Avg SLA (hrs)" [value]="5.2" [delta]="-0.4" icon="schedule"></hog-stat-card>
      <hog-stat-card class="span3" label="Escalations" [value]="3" [delta]="1" icon="priority_high"></hog-stat-card>

      <mat-card class="span8">
        <mat-card-header><mat-card-title>Team Throughput</mat-card-title></mat-card-header>
        <mat-card-content>
          <apx-chart
            [chart]="chartBarStack"
            [series]="seriesThroughput"
            [xaxis]="xaxisWeeks"
            [plotOptions]="plotBar45">
          </apx-chart>
        </mat-card-content>
      </mat-card>

      <mat-card class="span4">
        <mat-card-header><mat-card-title>Capacity</mat-card-title></mat-card-header>
        <mat-card-content>
          <apx-chart
            [chart]="chartRadial"
            [series]="seriesCapacity"
            [labels]="labelsCapacity">
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
export class DashManagerPage {
  weeks = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];
  chartBarStack: any = { type: 'bar', height: 260, stacked: true };
  seriesThroughput: any = [
    { name: 'Completed', data: [14,18,16,22,19,24,28,30,27,31,33,36] },
    { name: 'New',       data: [12,15,14,18,17,22,25,26,24,28,30,34] }
  ];
  xaxisWeeks: any = { categories: this.weeks };
  plotBar45: any = { bar: { columnWidth: '45%' } };

  chartRadial: any = { type: 'radialBar', height: 260 };
  seriesCapacity: any = [78];
  labelsCapacity: any = ['Utilization'];
}
