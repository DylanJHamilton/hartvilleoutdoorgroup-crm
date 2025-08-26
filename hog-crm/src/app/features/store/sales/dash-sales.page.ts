import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'hog-dash-sales',
  imports: [MatCardModule],
  template: `
    <h1 class="mat-headline-5">Sales Dashboard</h1>
    <mat-card><mat-card-content>My pipeline, tasks, quotes, won/forecast, etc.</mat-card-content></mat-card>
  `
})
export class DashSalesPage {}
