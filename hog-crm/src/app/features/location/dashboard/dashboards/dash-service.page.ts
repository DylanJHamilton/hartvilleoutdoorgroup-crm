import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HogChartDirective } from '../../../../shared/ui/chart/hog-chart.directive';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';

@Component({
  standalone: true,
  selector: 'hog-dash-service',
  imports: [CommonModule, MatCardModule, MatIconModule, HogChartDirective, StatCardComponent],
  template: `
    <div class="grid12">
      <hog-stat-card class="span3" label="Open Tickets" [value]="54" [delta]="-3" icon="support_agent"></hog-stat-card>
      <hog-stat-card class="span3" label="Resolved (MTD)" [value]="312" [delta]="7" icon="task_alt"></hog-stat-card>
      <hog-stat-card class="span3" label="First Response" [value]="'24m'" [delta]="-3" icon="sms"></hog-stat-card>
      <hog-stat-card class="span3" label="CSAT" [value]="'4.7/5'" [delta]="0.1" icon="thumb_up"></hog-stat-card>

      <mat-card class="span8">
        <mat-card-header><mat-card-title>Ticket Flow</mat-card-title></mat-card-header>
        <mat-card-content><div [hogChart]="areaOptions"></div></mat-card-content>
      </mat-card>

      <mat-card class="span4">
        <mat-card-header><mat-card-title>By Priority</mat-card-title></mat-card-header>
        <mat-card-content><div [hogChart]="pieOptions"></div></mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.grid12{display:grid;gap:16px;grid-template-columns:repeat(12,1fr);align-items:start}.span3{grid-column:span 3}.span4{grid-column:span 4}.span8{grid-column:span 8}@media(max-width:959px){.span3,.span4,.span8{grid-column:span 12}}`]
})
export class DashServicePage {
  areaOptions: any = {
    chart: { type: 'area', height: 260 },
    series: [
      { name:'Opened',   data:[20,22,24,23,25,27,29,26,28,24,22,21] },
      { name:'Resolved', data:[18,21,22,22,24,26,28,27,27,23,21,22] }
    ],
    xaxis: { categories: ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'] },
    stroke: { curve: 'smooth' }, dataLabels: { enabled: false }
  };
  pieOptions: any = { chart: { type: 'pie', height: 260 }, series: [15,28,57], labels: ['High','Medium','Low'] };
}
