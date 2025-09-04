import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { InventorySignalStore } from './inventory.store';
import { mockStores } from '../../../mock/locations.mock';

@Component({
  standalone: true,
  selector: 'hog-inventory',
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCheckboxModule,
    DragDropModule,
  ],
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
})
export class InventoryPage {
  private route = inject(ActivatedRoute);
  inv = inject(InventorySignalStore);

  // ===== Filters / UI state =====
  // '' = All Stores. We set this from route param if present (/location/:id/inventory)
  activeStoreId = signal<string>('');
  search = signal<string>('');
  categories = signal<string[]>([]);
  lowOnly = signal<boolean>(false);

  // Keep column list minimal for the demo table you asked for
  visibleCols = signal<string[]>(['sku', 'name', 'category', 'brand', 'price', 'qty', 'status']);

  // stores list as signal so template uses visibleStores()
  visibleStores = signal(mockStores);

  // demo: allow "All Stores"
  canAll = () => true;

  constructor() {
    // If the route is /location/:id/inventory, pick that id on load
    // Works whether this page is under /portal/inventory or /location/:id/inventory
    const id =
      this.route.snapshot.paramMap.get('id') ??
      this.route.parent?.snapshot.paramMap.get('id') ??
      '';

    if (id) this.activeStoreId.set(id);
  }

  // ===== Derived lists =====
  scopedItems = computed(() => {
    const all = this.inv.items();
    const sid = this.activeStoreId();
    return sid ? all.filter(i => i.storeId === sid) : all;
  });

  filteredItems = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cats = this.categories();
    const low = this.lowOnly();

    return this.scopedItems().filter(i => {
      const matchQ = !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q);
      const matchC = !cats.length || cats.includes(i.category);
      const matchL = !low || i.status === 'LOW';
      return matchQ && matchC && matchL;
    });
  });

  // For demo: no extra sort yet
  sortedItems = this.filteredItems;

  // ===== Template handlers (minimal; enough for demo) =====
  onStore(id: string) { this.activeStoreId.set(id ?? ''); }
  addRow() {} // no-op for now
  isEditable() { return true; }

  exportCsv(rows?: any[]) {
    const list = rows ?? this.filteredItems();
    if (!list.length) return;
    const headers = Object.keys(list[0]);
    const csv = [headers.join(',')]
      .concat(list.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // table perf
  trackById = (_: number, row: any) => row?.id;
}
