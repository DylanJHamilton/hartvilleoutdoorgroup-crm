import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'hog-reports',
  template: `
    <h1 class="text-2xl font-semibold">Reports</h1>
    <p class="text-sm text-neutral-500">Define & download reports (wire later)</p>
    <ul class="mt-4 list-disc pl-5">
      <li>Sales by Store</li>
      <li>Inventory Valuation</li>
      <li>Service SLA</li>
      <li>Delivery On-time %</li>
      <li>Rentals Utilization</li>
    </ul>
  `
})
export class ReportsPage {}
