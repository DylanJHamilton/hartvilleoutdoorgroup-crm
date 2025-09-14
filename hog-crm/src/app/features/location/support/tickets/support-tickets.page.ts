import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';

import {
  SupportTicketsService,
  TicketPriority,
  TicketStatus,
  SupportTicket,
} from '../services/support-tickets.service';
import { NewTicketDialog } from '../dialog/new-ticket.dialog';

@Component({
  standalone: true,
  selector: 'hog-support-tickets-page',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,

    // Material
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCheckboxModule,
  ],
  templateUrl: './support-tickets.page.html',
  styleUrls: ['./support-tickets.page.scss'],
})
export class SupportTicketsPage {
  private store = inject(SupportTicketsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // ------- Filters (signals)
  q = signal<string>('');
  status = signal<TicketStatus[]>([]);
  priority = signal<TicketPriority[]>([]);
  owner = signal<string[]>([]);

  // owners list from current store data (includes Unassigned)
  owners = computed(() => {
    const set = new Set<string>();
    this.store.tickets().forEach(t => set.add(t.assignedTo || 'Unassigned'));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  // ------- Table state
  displayedColumns = ['select', 'subject', 'status', 'priority', 'assignedTo', 'dueDate', 'updatedAt'];
  selection = new SelectionModel<string>(true, []);

  // keep filters in URL (q, status, priority, owner)
  constructor() {
    effect(() => {
      const qp = this.route.snapshot.queryParamMap;
      this.q.set(qp.get('q') ?? '');
      this.status.set(split(qp.get('status')) as TicketStatus[]);
      this.priority.set(split(qp.get('priority')) as TicketPriority[]);
      this.owner.set(split(qp.get('owner')));
    });
    effect(() => {
      const queryParams = {
        q: emptyToNull(this.q()),
        status: arrToParam(this.status()),
        priority: arrToParam(this.priority()),
        owner: arrToParam(this.owner()),
      };
      this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
    });
  }

  // filtered rows
  rows = computed(() =>
    this.store.list({
      q: this.q(),
      status: this.status(),
      priority: this.priority(),
      owner: this.owner(),
    })
  );

  // ------- Actions
  isAllSelected() {
    const ids = this.rows().map(r => r.id);
    return ids.length > 0 && ids.every(id => this.selection.isSelected(id));
  }
  masterToggle() {
    if (this.isAllSelected()) this.selection.clear();
    else this.rows().forEach(r => this.selection.select(r.id));
  }

  openNewTicket() {
    const ref = this.dialog.open(NewTicketDialog, { width: '560px', autoFocus: 'dialog', });
    ref.afterClosed().subscribe(payload => {
      if (!payload) return;
      const t = this.store.add(payload);
      this.snack.open('Ticket created', 'View', { duration: 2500 }).onAction().subscribe(() => {
        this.router.navigate(['../tickets', t.id], { relativeTo: this.route });
      });
    });
  }

  batch(action: 'assign' | 'status' | 'export') {
    if (!this.selection.selected.length) {
      this.snack.open('Select at least one ticket', 'OK', { duration: 2000 });
      return;
    }
    this.snack.open(`${action} — coming soon`, 'OK', { duration: 2000 });
  }

  clearAll() {
    this.q.set('');
    this.status.set([]);
    this.priority.set([]);
    this.owner.set([]);
  }
}

// --- helpers
function split(v: string | null): string[] {
  return v ? v.split(',').filter(Boolean) : [];
}
function arrToParam<T>(arr: T[]): string | null {
  return arr.length ? String(arr) : null;
}
function emptyToNull(v: string): string | null {
  return v?.trim() ? v : null;
}
