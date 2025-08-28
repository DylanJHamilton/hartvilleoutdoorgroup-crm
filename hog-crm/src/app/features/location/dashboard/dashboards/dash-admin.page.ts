import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HogChartDirective } from '../../../../shared/ui/chart/hog-chart.directive';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';

@Component({
  standalone: true,
  selector: 'hog-dash-admin',
  imports: [CommonModule, MatCardModule, MatIconModule, HogChartDirective, StatCardComponent],
  template: `
    <div class="grid12">
      <hog-stat-card class="span3" label="Active Users" [value]="1280" [delta]="6" icon="groups"></hog-stat-card>
      <hog-stat-card class="span3" label="Revenue" [value]="'$42.3k'" [delta]="4" icon="payments"></hog-stat-card>
      <hog-stat-card class="span3" label="New Leads" [value]="237" [delta]="9" icon="person_add"></hog-stat-card>
      <hog-stat-card class="span3" label="Uptime" [value]="'99.98%'" [delta]="0.01" icon="cloud_done"></hog-stat-card>

      <mat-card class="span8">
        <mat-card-header><mat-card-title>System Activity (Last 12w)</mat-card-title></mat-card-header>
        <mat-card-content><div [hogChart]="lineOptions"></div></mat-card-content>
      </mat-card>

      <mat-card class="span4">
        <mat-card-header><mat-card-title>Users by Role</mat-card-title></mat-card-header>
        <mat-card-content><div [hogChart]="donutOptions"></div></mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.grid12{display:grid;gap:16px;grid-template-columns:repeat(12,1fr);align-items:start}.span3{grid-column:span 3}.span4{grid-column:span 4}.span8{grid-column:span 8}@media(max-width:959px){.span3,.span4,.span8{grid-column:span 12}}`]
})
export class DashAdminPage {
  lineOptions: any = {
    chart: { type: 'line', height: 260, toolbar: { show: false } },
    series: [{ name: 'Events', data: [12,14,18,16,22,25,28,26,30,34,32,38] }],
    xaxis: { categories: ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'] },
    stroke: { curve: 'smooth', width: 3 }, grid: { strokeDashArray: 4 }
  };
  donutOptions: any = {
    chart: { type: 'donut', height: 260 },
    series: [42,33,15,10],
    labels: ['Manager','Sales','Service','Other']
  };
}
