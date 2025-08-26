import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';

@Component({
  standalone: true,
  selector: 'hog-dash-sales',
  imports: [CommonModule, MatCardModule, MatIconModule, NgApexchartsModule, StatCardComponent],
  template: `
    <div class="grid12">
      <hog-stat-card class="span3" label="Pipeline" [value]="'$312k'" [delta]="8" icon="timeline"></hog-stat-card>
      <hog-stat-card class="span3" label="Won (MTD)" [value]="'$96k'" [delta]="5" icon="emoji_events"></hog-stat-card>
      <hog-stat-card class="span3" label="Avg Deal" [value]="'$7.8k'" [delta]="2" icon="attach_money"></hog-stat-card>
      <hog-stat-card class="span3" label="Win Rate" [value]="'32%'" [delta]="1" icon="percent"></hog-stat-card>

      <mat-card class="span8">
        <mat-card-header><mat-card-title>Deals by Stage</mat-card-title></mat-card-header>
        <mat-card-content>
          <apx-chart
            [chart]="chartBar"
            [series]="seriesDeals"
            [xaxis]="xaxisStages"
            [plotOptions]="plotBarDist">
          </apx-chart>
        </mat-card-content>
      </mat-card>

      <mat-card class="span4">
        <mat-card-header><mat-card-title>Leads by Source</mat-card-title></mat-card-header>
        <mat-card-content>
          <apx-chart
            [chart]="chartPie"
            [series]="seriesLeads"
            [labels]="labelsLeads">
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
export class DashSalesPage {
  chartBar: any = { type: 'bar', height: 260 };
  seriesDeals: any = [{ name: 'Deals', data: [35,28,22,14,8] }];
  xaxisStages: any = { categories: ['New','Qualified','Proposal','Negotiation','Closed'] };
  plotBarDist: any = { bar: { distributed: true, columnWidth: '45%' } };

  chartPie: any = { type: 'pie', height: 260 };
  seriesLeads: any = [40,25,20,15];
  labelsLeads: any = ['Web','Referral','Events','Ads'];
}
