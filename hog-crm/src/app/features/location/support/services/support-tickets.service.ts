import { Injectable, signal } from '@angular/core';

export type TicketStatus   = 'Open'|'In Progress'|'Waiting'|'Resolved'|'Closed';
export type TicketPriority = 'Low'|'Normal'|'High'|'Urgent';

export interface SupportTicket {
  id: string;
  customerId: string;     // Location Customers ID (e.g., 'c1','c2')
  subject: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  dueDate?: string;       // ISO
  createdAt: string;      // ISO
  updatedAt: string;      // ISO
}

export interface SupportActivity {
  id: string;
  ticketId: string;
  atISO: string;          // ISO
  kind: 'note'|'status'|'assignment'|'attachment';
  summary: string;
  byUserId?: string;
}

@Injectable({ providedIn: 'root' })
export class SupportTicketsService {
  private seedTickets: SupportTicket[] = [
    {
      id: 't1',
      customerId: 'c1',
      subject: 'Delivery date confirmation',
      description: 'Customer asked to confirm delivery window.',
      status: 'Open',
      priority: 'Normal',
      assignedTo: 'Alex Admin',
      dueDate: addHoursISO(24),
      createdAt: addHoursISO(-6),
      updatedAt: addHoursISO(-1),
    },
    {
      id: 't2',
      customerId: 'c2',
      subject: 'Damaged part on shed door',
      description: 'Reported dent on left panel; needs replacement part.',
      status: 'Waiting',
      priority: 'High',
      assignedTo: 'Casey Support',
      dueDate: addHoursISO(2),
      createdAt: addHoursISO(-20),
      updatedAt: addHoursISO(-2),
    },
    {
      id: 't3',
      customerId: 'c1',
      subject: 'Invoice copy request',
      description: 'Customer needs PDF invoice for records.',
      status: 'In Progress',
      priority: 'Low',
      assignedTo: undefined,
      dueDate: addHoursISO(-3), // overdue on purpose
      createdAt: addHoursISO(-40),
      updatedAt: addHoursISO(-4),
    }
  ];

  private seedActivities: SupportActivity[] = [
    { id: 'a1', ticketId: 't2', atISO: addHoursISO(-2), kind: 'note', summary: 'Requested photo of dent.' },
    { id: 'a2', ticketId: 't1', atISO: addHoursISO(-1), kind: 'status', summary: 'Status changed to Open.' },
    { id: 'a3', ticketId: 't3', atISO: addHoursISO(-4), kind: 'assignment', summary: 'Unassigned → Queue' },
  ];

  readonly tickets    = signal<SupportTicket[]>(this.seedTickets);
  readonly activities = signal<SupportActivity[]>(this.seedActivities);

  byId(id: string) { return this.tickets().find(t => t.id === id) || null; }

  list(filters?: { q?: string; status?: TicketStatus[]; priority?: TicketPriority[]; owner?: string[] }) {
    let rows = this.tickets();
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      rows = rows.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.assignedTo ?? '').toLowerCase().includes(q)
      );
    }
    if (filters?.status?.length) {
      rows = rows.filter(t => filters.status!.includes(t.status));
    }
    if (filters?.priority?.length) {
      rows = rows.filter(t => filters.priority!.includes(t.priority));
    }
    if (filters?.owner?.length) {
      const owners = new Set(filters.owner!.map(s => s.toLowerCase()));
      rows = rows.filter(t => owners.has((t.assignedTo ?? 'unassigned').toLowerCase()));
    }
    return rows;
  }

  activitiesFor(ticketId: string) {
    return this.activities().filter(a => a.ticketId === ticketId).sort((a,b) => a.atISO.localeCompare(b.atISO));
  }

  add(partial: Partial<SupportTicket>) {
    const now = isoNow();
    const t: SupportTicket = {
      id: cryptoId(),
      customerId: partial.customerId ?? 'c1',
      subject: partial.subject ?? 'New ticket',
      description: partial.description ?? '',
      status: partial.status ?? 'Open',
      priority: partial.priority ?? 'Normal',
      assignedTo: partial.assignedTo,
      dueDate: partial.dueDate,
      createdAt: now,
      updatedAt: now,
    };
    this.tickets.update(arr => [t, ...arr]);
    return t;
  }

  update(id: string, patch: Partial<SupportTicket>) {
    this.tickets.update(arr => arr.map(t => t.id === id ? { ...t, ...patch, updatedAt: isoNow() } : t));
  }

  remove(id: string) {
    this.tickets.update(arr => arr.filter(t => t.id !== id));
    this.activities.update(arr => arr.filter(a => a.ticketId !== id));
  }

  addActivity(ticketId: string, entry: Omit<SupportActivity,'id'|'ticketId'|'atISO'> & { atISO?: string }) {
    const act: SupportActivity = {
      id: cryptoId(),
      ticketId,
      atISO: entry.atISO ?? isoNow(),
      kind: entry.kind,
      summary: entry.summary,
      byUserId: entry.byUserId,
    };
    this.activities.update(arr => [...arr, act]);
    this.update(ticketId, {}); // bump updatedAt
    return act;
  }
}

function isoNow(): string { return new Date().toISOString(); }
function addHoursISO(hours: number): string { const d = new Date(); d.setHours(d.getHours() + hours); return d.toISOString(); }
function cryptoId(): string { return (globalThis.crypto as any)?.randomUUID?.() ?? 'id-' + Math.random().toString(36).slice(2,10); }
