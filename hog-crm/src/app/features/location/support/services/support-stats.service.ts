import { Injectable, computed, signal, inject } from '@angular/core';
import { SupportTicketsService, SupportTicket } from './support-tickets.service';

@Injectable({ providedIn: 'root' })
export class SupportStatsService {
  private store = inject(SupportTicketsService);
  private now = signal(new Date());

  readonly all = this.store.tickets; // signal<SupportTicket[]>

  readonly open = computed(() => this.all().filter(t => ['Open','In Progress','Waiting'].includes(t.status)));
  readonly waiting = computed(() => this.all().filter(t => t.status === 'Waiting'));

  readonly dueToday = computed(() => {
    const today = toYYYYMMDD(this.now());
    return this.open().filter(t => (t.dueDate ?? '').slice(0,10) === today);
  });

  readonly overdue = computed(() => {
    const n = this.now().toISOString();
    return this.open().filter(t => (t.dueDate ?? '') < n);
  });

  readonly perAgentLoad = computed(() => {
    const map = new Map<string, number>();
    this.open().forEach(t => map.set(t.assignedTo ?? 'Unassigned', (map.get(t.assignedTo ?? 'Unassigned') ?? 0) + 1));
    return Array.from(map.entries()).map(([agent, count]) => ({ agent, count }));
  });
  readonly slaBreaches = computed(() => this.overdue().length);
  readonly avgTimeToResolveHours = computed(() => 0); // placeholder

  readonly monthlyVolume = computed(() => {
    const buckets = new Map<string, number>();
    this.all().forEach(t => {
      const ym = (t.createdAt ?? '').slice(0,7);
      if (!ym) return;
      buckets.set(ym, (buckets.get(ym) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).sort(([a],[b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  });
  readonly estCostPerTicket = computed(() => 0);
  readonly csat = computed(() => null as number | null);
}

function toYYYYMMDD(d: Date): string { return d.toISOString().slice(0,10); }
