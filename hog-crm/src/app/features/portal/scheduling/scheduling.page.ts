import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

type Store = { id: string; name: string; slug: 's1'|'s2'|'s3' };

const STORES: Store[] = [
  { id: '1', name: 'Hartville HQ', slug: 's1' },
  { id: '2', name: 'Medina',       slug: 's2' },
  { id: '3', name: 'Mentor',       slug: 's3' },
];

@Component({
  standalone: true,
  selector: 'hog-scheduling',
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './scheduling.page.html',
  styleUrls: ['./scheduling.page.scss'],
})
export class SchedulingPage {
  // --- Store filter
  stores = STORES;
  activeStoreId = signal<string>('1'); // default to HQ
  onStoreChange(id: string) { this.activeStoreId.set(id); }

  // --- Derived helpers
  store = computed(() => this.stores.find(s => s.id === this.activeStoreId())!);
  storeTitle = computed(() => `${this.store()?.name} (${this.store()?.slug})`);

  // --- Mock data per store (deterministic, lightweight)
  private deliveriesFor(storeId: string) {
    // rotate products / drivers by storeId
    const sid = parseInt(storeId, 10) || 1;
    const P = [
      ['12x16 Barn Shed', 'Poly Playset A3', 'Club Car 48V (refurb)', 'EZGO RXV', '12x20 Garage', 'Evolution Forester 6'],
      ['10x20 Garage', 'Poly Trampoline 12ft', 'Denago Rover S', 'Evolution D5', '12x24 Cabin', 'Dash Elite 48V'],
      ['Poly Adirondack (6)', 'Playset B2', 'EZGO TXT (refurb)', 'Club Car 48V', '12x28 Barn', 'Evolution D5 Maverick'],
    ][(sid - 1) % 3];

    const D = [
      ['Aiden F.', 'Mike R.', 'Sara L.', 'Dispatch', 'Team', 'R. Brooks'],
      ['J. Ortiz', 'K. Patel', 'T. Nguyen', 'Dispatch', 'Team', 'M. Garcia'],
      ['L. Chen', 'B. Adams', 'N. Shah', 'Dispatch', 'Team', 'E. Davis'],
    ][(sid - 1) % 3];

    // Mon–Sat single entries, Sun empty (same shape as dashboard)
    const items = (label: string, entries: any[]) => ({ label, items: entries });
    return [
      items('Mon', [{ time: '9:00a',  truck: 'A', driver: D[0], product: P[0] }]),
      items('Tue', [{ time: '10:00a', truck: 'B', driver: D[1], product: P[1] }]),
      items('Wed', [{ time: '1:30p',  truck: 'C', driver: D[2], product: P[2] }]),
      items('Thu', [{ time: '11:00a', truck: 'A', driver: D[3], product: P[3] }]),
      items('Fri', [{ time: '2:00p',  truck: 'B', driver: D[4], product: P[4] }]),
      items('Sat', [{ time: '9:00a',  truck: 'A', driver: D[5], product: P[5] }]),
      items('Sun', []),
    ];
  }

  private serviceStatsFor(storeId: string) {
    // scale counts slightly by store to feel alive
    const sid = parseInt(storeId, 10) || 1;
    return {
      open: 10 + sid * 2,
      progress: 6 + sid,
      parts: 3 + (sid % 2),
      techs: 3 + sid,
    };
  }

  private serviceJobsFor(storeId: string) {
    const sid = parseInt(storeId, 10) || 1;
    const base = [
      { id: 4310 + sid, sev: 'High',   status: 'In Progress',   title: 'Brake adjustment', asset: 'EZGO RXV #' + (110 + sid), tech: 'D. Carter', eta: 'Today 4:30p' },
      { id: 4320 + sid, sev: 'Medium', status: 'Waiting Parts', title: 'Battery check',    asset: 'Club Car 48V #' + (70 + sid), tech: 'L. Nguyen', eta: 'Tomorrow'    },
      { id: 4330 + sid, sev: 'Low',    status: 'Open',          title: 'Detail & prep',    asset: '12x16 Barn Shed', tech: 'K. Patel',  eta: 'Fri'         },
    ];
    const rank: any = { High: 0, Medium: 1, Low: 2 };
    return base.sort((a, b) => rank[a.sev] - rank[b.sev]);
  }

  // --- Computed for template
  deliveryCalendar = computed(() => this.deliveriesFor(this.activeStoreId()));
  service = computed(() => this.serviceStatsFor(this.activeStoreId()));
  serviceJobs = computed(() => this.serviceJobsFor(this.activeStoreId()));
}
