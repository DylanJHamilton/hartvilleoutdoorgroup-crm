import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContextService } from '../../../core/context/context.service';

@Component({
  standalone: true,
  selector: 'hog-stores',
  imports: [CommonModule, RouterLink],
  template: `
    <h1 class="text-2xl font-semibold">Stores</h1>
    <div class="mt-4 space-y-2">
      <div *ngFor="let s of stores" class="p-3 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <div class="font-medium">{{ s.name }}</div>
          <div class="text-xs text-neutral-500">{{ s.city || '—' }}</div>
        </div>
        <a [routerLink]="['/store', s.id]" class="px-3 py-1 rounded bg-neutral-900 text-white text-sm">Open</a>
      </div>
    </div>
  `
})
export class StoresPage {
  private ctx = inject(ContextService);
  // Replace with API call later
  stores = [
    { id: '1', name: 'Hartville — Main', city: 'Hartville' },
    { id: '2', name: 'Medina', city: 'Medina' },
    { id: '3', name: 'Mentor', city: 'Mentor' },
  ];
}
