import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'hog-kpi-card',
  imports: [CommonModule, MatCardModule],
  styles: [`.small{color:rgba(0,0,0,.6);font-size:12px}`],
  template: `
    <mat-card>
      <mat-card-subtitle class="small">{{subtitle}}</mat-card-subtitle>
      <mat-card-title>{{title}}</mat-card-title>
      <mat-card-content><ng-content /></mat-card-content>
    </mat-card>
  `
})
export class KpiCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
