import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'hog-sales-quick-links',
  imports: [],
  templateUrl: './sales-quick-links.html',
  styleUrl: './sales-quick-links.scss'
})
export class SalesQuickLinksComponent {
  storeId = input.required<string>();
    role    = input<'Owner'|'Admin'|'Manager'|'Sales'|'Other'>('Other');

    base = computed(() => ['/location', this.storeId(), 'sales']);

    links = computed(() => ([
      { label:'Pipeline',    to:[...this.base(), 'pipeline'] },
      { label:'Current Deals', to:[...this.base(), 'deals'] },
      { label:'Documents & Quotes', to:[...this.base(), 'documents'] },
      { label:'Performance', to:[...this.base(), 'performance'] },
      { label:'Prospecting', to:[...this.base(), 'prospecting'] },
      { label:'Tasks',       to:[...this.base(), 'tasks'] },
    ]));
}
