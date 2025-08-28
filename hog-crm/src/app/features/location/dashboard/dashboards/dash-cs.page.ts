import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HogChartDirective } from '../../../../shared/ui/chart/hog-chart.directive';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';

@Component({
  standalone: true,
  selector: 'hog-dash-cs',
  imports: [CommonModule, MatCardModule, MatIconModule, HogChartDirective, StatCardComponent],
  template: `
    <div class="grid12">
      <hog-stat-card class="span3" label="Open Cases" [value]="31" [delta]="-2" icon="support"></hog-stat-card>
      <hog-stat-card class="span3" label="Avg Handle" [value]="'6m 12s'" [delta]="-0.5" icon="headset_mic"></hog-stat-card>
      <hog-stat-card class="span3" label="FCR" [value]="'81%'" [delta]="2" icon="task_alt"></hog-stat-card>
      <hog-stat-card class="span3" label="NPS" [value]="62" [delta]="3" icon="sentiment_satisfied"></hog-stat-card>

      <mat-card class="span8">
        <mat-card-header><mat-card-title>Contacts by Channel</mat-card-title></mat-card-header>
        <mat-card-content><div [hogChart]="barOptions"></div></mat-card-content>
      </mat-card>

      <mat-card class="span4">
        <mat-card-header><mat-card-title>Satisfaction</mat-card-title></mat-card-header>
        <mat-card-content><div [hogChart]="radialOptions"></div></mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.grid12{display:grid;gap:16px;grid-template-columns:repeat(12,1fr);align-items:start}.span3{grid-column:span 3}.span4{grid-column:span 4}.span8{grid-column:span 8}@media(max-width:959px){.span3,.span4,.span8{grid-column:span 12}}`]
})
export class DashCsPage {
  barOptions: any = {
    chart: { type: 'bar', height: 260 },
    series: [{ name: 'Contacts', data: [280,190,140,80] }],
    xaxis: { categories: ['Phone','Email','Web','SMS'] },
    plotOptions: { bar: { columnWidth: '50%' } }
  };
  radialOptions: any = { chart: { type: 'radialBar', height: 260 }, series: [92], labels: ['CSAT'] };
}
