import { Component, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';

import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ActivityItem, ActivityStatus, ActivityType } from '../../../../types/sales/appointments/appointments.types';
import { ActivitiesService } from './appointments.service';
import { AddEditAppointmentDialog } from './dialog/add-edit-appointment.dialog';

@Component({
  standalone: true,
  selector: 'hog-appointments-page',
  imports: [
    CommonModule,
    FormsModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatDatepickerModule, MatNativeDateModule,
    MatCheckboxModule,
  ],
  templateUrl: './appointments-page.html',
  styleUrl: './appointments-page.scss'
})
export class AppointmentsPage {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private svc = inject(ActivitiesService);

  displayedColumns = ['select','customer','subject','type','owner','datetime','status','actions'];

  // data + selection
  data = signal<ActivityItem[]>(this.svc.getSeeded(28));
  selection = new SelectionModel<ActivityItem>(true, []);

  // filter state
  filterForm = this.fb.group({
    search: [''],
    type: ['' as '' | ActivityType],
    ownerId: [''],
    status: ['' as '' | ActivityStatus],
    from: <Date | null>null,
    to: <Date | null>null,
    showAppointmentsOnly: [false],
  });

  owners = this.svc.owners;
  types: ActivityType[] = ['Call','Meeting','Task'];
  statuses: ActivityStatus[] = ['Planned','Completed','Canceled'];

  filtered = computed(() => {
    const items = this.data();
    const f = this.filterForm.value;
    const term = (f.search ?? '').toLowerCase();

    return items.filter(it => {
      if (f.showAppointmentsOnly && !it.isAppointment) return false;
      if (f.type && it.type !== f.type) return false;
      if (f.ownerId && it.ownerId !== f.ownerId) return false;
      if (f.status && it.status !== f.status) return false;

      if (f.from) {
        const dt = new Date(it.datetime);
        if (dt < f.from) return false;
      }
      if (f.to) {
        const dt = new Date(it.datetime);
        const end = new Date(f.to); end.setHours(23,59,59,999); // include entire end day
        if (dt > end) return false;
      }

      if (term) {
        const blob = `${it.customer} ${it.subject} ${it.ownerName}`.toLowerCase();
        if (!blob.includes(term)) return false;
      }
      return true;
    });
  });

  // paginator + sort hooks (Material)
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // quick-add mini form (top bar)
  quickAddForm = this.fb.group({
    customer: ['', Validators.required],
    subject: ['', Validators.required],
    type: ['Meeting' as ActivityType, Validators.required],
    datetime: [new Date(), Validators.required],
    ownerId: ['', Validators.required],
  });

  constructor() {
    // Ensure default owner in quick add if available
    if (!this.quickAddForm.value.ownerId && this.owners[0]) {
      this.quickAddForm.patchValue({ ownerId: this.owners[0].id });
    }

    // reset selection on filter changes
    effect(() => {
      this.filtered(); // track
      this.selection.clear();
    });
  }

  // table helpers
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.filtered().length;
    return numSelected === numRows && numRows > 0;
  }
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.filtered().forEach(row => this.selection.select(row));
  }

  openAddDialog() {
    const ref = this.dialog.open(AddEditAppointmentDialog, {
      panelClass: 'hog-dialog',
      data: { mode: 'add' }
    });
    ref.afterClosed().subscribe((val: ActivityItem | undefined) => {
      if (!val) return;
      this.data.update(arr => [val, ...arr]);
    });
  }

  edit(row: ActivityItem) {
    const ref = this.dialog.open(AddEditAppointmentDialog, {
      panelClass: 'hog-dialog',
      data: { mode: 'edit', value: row }
    });
    ref.afterClosed().subscribe((val: ActivityItem | undefined) => {
      if (!val) return;
      this.data.update(arr => arr.map(a => a.id === val.id ? val : a));
    });
  }

  delete(row: ActivityItem) {
    this.data.update(arr => arr.filter(a => a.id !== row.id));
    this.selection.deselect(row);
  }

  quickAdd() {
    if (this.quickAddForm.invalid) return;
    const v = this.quickAddForm.value;
    const owner = this.owners.find(o => o.id === v.ownerId);
    const newItem: ActivityItem = {
      id: this.svc.nextId(),
      customer: v.customer!,
      subject: v.subject!,
      type: v.type!,
      ownerId: v.ownerId!,
      ownerName: owner?.name ?? 'Unassigned',
      datetime: (v.datetime as Date).toISOString(),
      status: 'Planned',
      notes: '',
      isAppointment: v.type === 'Meeting'
    };
    this.data.update(arr => [newItem, ...arr]);
    this.quickAddForm.reset({
      customer: '',
      subject: '',
      type: 'Meeting',
      datetime: new Date(),
      ownerId: owner?.id ?? this.owners[0]?.id ?? ''
    });
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      type: '',
      ownerId: '',
      status: '',
      from: null,
      to: null,
      showAppointmentsOnly: false
    });
  }

  /** Tailwind badge helpers (used in HTML via [ngClass]) */
  statusClass(s: ActivityStatus) {
    switch (s) {
      case 'Planned':   return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Canceled':  return 'bg-red-100 text-red-800';
      default:          return 'bg-gray-100 text-gray-800';
    }
  }
  typeClass(t: ActivityType) {
    switch (t) {
      case 'Meeting': return 'bg-indigo-100 text-indigo-800';
      case 'Call':    return 'bg-amber-100 text-amber-800';
      case 'Task':    return 'bg-slate-100 text-slate-800';
      default:        return 'bg-gray-100 text-gray-800';
    }
  }
}
