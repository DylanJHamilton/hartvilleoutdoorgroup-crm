import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'hog-scheduling',
  imports: [CommonModule, MatCardModule],
  template: `
    <section class="page">
      <div class="header">
        <div>
          <div class="breadcrumb">Portal / Scheduling</div>
          <h1 class="title">Scheduling</h1>
          <div class="subtitle">Delivery & Service resource calendars (MVP placeholder)</div>
        </div>
      </div>

      <div class="cards">
        <mat-card class="card mat-elevation-z1">
          <mat-card-header><mat-card-title>Delivery Calendar</mat-card-title></mat-card-header>
          <mat-card-content>Integrate GHL or custom calendars here.</mat-card-content>
        </mat-card>
        <mat-card class="card mat-elevation-z1">
          <mat-card-header><mat-card-title>Service Calendar</mat-card-title></mat-card-header>
          <mat-card-content>Technician scheduling & capacity planning.</mat-card-content>
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
    .cards { display:grid; gap:16px; grid-template-columns: repeat(12, 1fr); }
    .card { grid-column: span 6; }
    @media (max-width: 900px) { .card { grid-column: span 12; } }
  `]
})
export class SchedulingPage {}
