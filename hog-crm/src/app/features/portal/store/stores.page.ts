import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { mockStores } from '../../../mock/locations.mock';

@Component({
  standalone: true,
  selector: 'hog-stores',
  imports: [CommonModule, MatCardModule, RouterLink],
  template: `
    <section class="page">
      <div class="header">
        <div>
          <div class="breadcrumb">Portal / Stores</div>
          <h1 class="title">Stores</h1>
          <div class="subtitle">Open any store dashboard</div>
        </div>
      </div>

      <div class="cards">
        <mat-card class="store mat-elevation-z1" *ngFor="let s of stores">
          <mat-card-header>
            <mat-card-title>{{ s.name }}</mat-card-title>
            <mat-card-subtitle>ID: {{ s.id }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-actions>
            <a mat-button color="primary" [routerLink]="'/location/' + s.id + '/dashboard'">Open</a>
          </mat-card-actions>
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
    .store { grid-column: span 4; }
    @media (max-width: 1200px) { .store { grid-column: span 6; } }
    @media (max-width: 700px) { .store { grid-column: span 12; } }
  `]
})
export class StoresPage {
  stores = mockStores;
}
