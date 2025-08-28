import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HogChartDirective } from '../../../../shared/ui/chart/hog-chart.directive';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';

@Component({
  standalone: true,
  selector: 'hog-dash-delivery',
  imports: [CommonModule, MatCardModule, MatIconModule, HogChartDirective, StatCardComponent],
  template: `
    <div class="grid12">
      <hog-stat-card class="span3" label="In Transit" [value]="19" [delta]="2" icon="local_shipping"></hog-stat-card>
      <hog-stat-card class="span3" label="Delivered (MTD)" [value]="142" [delta]="5" icon="check_circle"></hog-stat-card>
      <hog-stat-card class="span3" label="On-Time %" [value]="'96%'" [delta]="1" icon="schedule"></hog-stat-card>
      <hog-stat-card class="span3" label="Avg Route (mi)" [value]="38" [delta]="-3" icon="route"></hog-stat-card>

      <mat-card class="span8">
        <mat-card-header><mat-card-title>Daily Drops (2w)</mat-card-title></mat-card-header>
        <mat-card-content><div [hogChart]="lineOptions"></div></mat-card-content>
      </mat-card>

      <mat-card class="span4">
        <mat-card-header><mat-card-title>Vehicle Mix</mat-card-title></mat-card-header>
        <mat-card-content><div [hogChart]="donutOptions"></div></mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.grid12{display:grid;gap:16px;grid-template-columns:repeat(12,1fr);align-items:start}.span3{grid-column:span 3}.span4{grid-column:span 4}.span8{grid-column:span 8}@media(max-width:959px){.span3,.span4,.span8{grid-column:span 12}}`]
})
export class DashDeliveryPage {
  lineOptions: any = {
    chart: { type: 'line', height: 260 },
    series: [{ name: 'Deliveries', data: [10,12,14,9,11,13,12,15,14,12,16,17,13,15] }],
    xaxis: { categories: ['M1','T1','W1','T1','F1','S1','S1','M2','T2','W2','T2','F2','S2','S2'] },
    stroke: { curve: 'smooth', width: 3 }
  };
  donutOptions: any = { chart: { type: 'donut', height: 260 }, series: [55,30,15], labels: ['Truck','Trailer','Van'] };
}
