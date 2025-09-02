import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'hog-inventory',
  imports: [CommonModule, MatCardModule],
  template: `
    <section class="page">
      <div class="header">
        <div>
          <div class="breadcrumb">Portal / Inventory</div>
          <h1 class="title">Inventory (Cross-Location)</h1>
          <div class="subtitle">Airtable-like grid planned; MVP placeholder</div>
        </div>
      </div>

      <mat-card class="mat-elevation-z1">
        <mat-card-content>
          <ul class="list">
            <li>Search across all stores</li>
            <li>Filters: status, category, location</li>
            <li>Bulk actions (future)</li>
          </ul>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; gap:16px; }
    .header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
    .breadcrumb { font-size:12px; color:rgba(0,0,0,.54); }
    .title { font: 600 22px/1.2 system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial; margin:4px 0; }
    .subtitle { color:rgba(0,0,0,.54); font-size:13px }
    .list { margin: 0; padding-left: 18px; }
  `]
})
export class InventoryPage {}
