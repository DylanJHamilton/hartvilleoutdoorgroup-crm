import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormArray,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import type { Customer } from '../../../../types/customer.types';
import { mockStores } from '../../../../mock/locations.mock';
import { mockUsers } from '../../../../mock/users.mock';

export type EditCustomerData = { customer: Customer };

type ApptFG = FormGroup<{
  id: FormControl<string>;
  title: FormControl<string>;
  startsAt: FormControl<string>;           // yyyy-MM-ddTHH:mm (local) in form; convert to ISO on save
  endsAt: FormControl<string | null>;
  note: FormControl<string | null>;
}>;

// Safe element type for optional array
type Appointment = NonNullable<Customer['appointments']>[number];

@Component({
  standalone: true,
  selector: 'hog-customer-edit-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
  <h2 mat-dialog-title>Edit Customer</h2>

  <div mat-dialog-content class="grid g16" [formGroup]="form">
    <!-- Core fields -->
    <mat-form-field appearance="outline">
      <mat-label>Name</mat-label>
      <input matInput formControlName="name" required />
      <mat-error *ngIf="form.controls.name.invalid">Name is required</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Email</mat-label>
      <input matInput formControlName="email" type="email" />
      <mat-error *ngIf="form.controls.email.invalid">Enter a valid email</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Phone</mat-label>
      <input matInput formControlName="phone" />
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Store Location</mat-label>
      <mat-select formControlName="storeLocationId" required>
        <mat-option *ngFor="let s of stores" [value]="s.id">{{ s.name }}</mat-option>
      </mat-select>
      <mat-error *ngIf="form.controls.storeLocationId.invalid">Store is required</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Desired Product</mat-label>
      <input matInput formControlName="desiredProduct" />
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Sales Owner</mat-label>
      <mat-select formControlName="salesOwnerUserId">
        <mat-option [value]="null">Unassigned</mat-option>
        <mat-option *ngFor="let u of users" [value]="u.id">{{ u.name }}</mat-option>
      </mat-select>
    </mat-form-field>

    <mat-form-field appearance="outline" class="full">
      <mat-label>Additional Details</mat-label>
      <textarea matInput rows="3" formControlName="additionalDetails"></textarea>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Potential Value</mat-label>
      <input matInput type="number" min="0" step="1" formControlName="value" />
    </mat-form-field>

    <mat-form-field appearance="outline" class="full">
      <mat-label>Support Notes (latest)</mat-label>
      <textarea matInput rows="3" formControlName="supportNotes"></textarea>
    </mat-form-field>

    <mat-divider class="full"></mat-divider>

    <!-- Appointments -->
    <div class="appt-header full">
      <h3 class="h3">Appointments ({{ appointments.length }})</h3>
      <button mat-stroked-button color="primary" type="button" (click)="addAppointment()">
        <mat-icon>add</mat-icon><span>Add Appointment</span>
      </button>
    </div>

    <div class="appts full" formArrayName="appointments">
      <div class="appt" *ngFor="let group of appointments.controls; let i = index" [formGroupName]="i">
        <div class="row">
          <mat-form-field appearance="outline" class="w100">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w100">
            <mat-label>Starts</mat-label>
            <input matInput type="datetime-local" formControlName="startsAt" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w100">
            <mat-label>Ends</mat-label>
            <input matInput type="datetime-local" formControlName="endsAt" />
          </mat-form-field>

          <button mat-icon-button color="warn" class="shrink" type="button" (click)="removeAppointment(i)" aria-label="Remove">
            <mat-icon>delete</mat-icon>
          </button>
        </div>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Note</mat-label>
          <textarea matInput rows="2" formControlName="note"></textarea>
        </mat-form-field>

        <mat-divider></mat-divider>
      </div>
    </div>
  </div>

  <div mat-dialog-actions align="end">
    <button mat-button (click)="close()">Cancel</button>
    <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
  </div>
  `,
  styles: [`
    .grid { display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:16px; }
    .full { grid-column: 1 / -1; }
    .appt-header { display:flex; align-items:center; justify-content:space-between; }
    .appts { display:flex; flex-direction:column; gap:12px; }
    .appt .row { display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap; }
    .w100 { flex: 1 1 220px; }
    .shrink { flex: 0 0 auto; align-self: center; }
    .h3 { margin: 0; font-size: 16px; font-weight: 700; }
  `]
})
export class CustomerEditDialog {
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<CustomerEditDialog, Customer | undefined>);
  private data = inject<EditCustomerData>(MAT_DIALOG_DATA);

  stores = mockStores;
  users = mockUsers;

  // helpers: ISO <-> datetime-local (local)
  private toLocalInput(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  private toIso(localStr?: string | null): string | undefined {
    if (!localStr) return undefined;
    const d = new Date(localStr);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  private apptGroup(a?: Appointment): ApptFG {
    return this.fb.nonNullable.group({
      id: this.fb.nonNullable.control<string>(a?.id ?? this.makeId('appt')),
      title: this.fb.nonNullable.control<string>(a?.title ?? ''),
      startsAt: this.fb.nonNullable.control<string>(this.toLocalInput(a?.startsAt) ?? ''),
      endsAt: this.fb.control<string | null>(this.toLocalInput(a?.endsAt) || null),
      note: this.fb.control<string | null>(a?.note ?? null),
    }) as ApptFG;
  }

  // Strongly-typed root form
  form: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    phone: FormControl<string>;
    storeLocationId: FormControl<string>;
    desiredProduct: FormControl<string>;
    salesOwnerUserId: FormControl<string | null>;
    additionalDetails: FormControl<string>;
    value: FormControl<number | null>;
    supportNotes: FormControl<string>;
    appointments: FormArray<ApptFG>;
  }> = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>(this.data.customer.name, { validators: [Validators.required] }),
    email: this.fb.control<string>(this.data.customer.email, { validators: [Validators.email], nonNullable: true }),
    phone: this.fb.nonNullable.control<string>(this.data.customer.phone ?? ''),
    storeLocationId: this.fb.nonNullable.control<string>(this.data.customer.storeLocationId, { validators: [Validators.required] }),
    desiredProduct: this.fb.nonNullable.control<string>(this.data.customer.desiredProduct ?? ''),
    salesOwnerUserId: this.fb.control<string | null>(this.data.customer.salesOwnerUserId ?? null),
    additionalDetails: this.fb.nonNullable.control<string>(this.data.customer.additionalDetails ?? ''),
    value: this.fb.control<number | null>(this.data.customer.value ?? null),
    supportNotes: this.fb.nonNullable.control<string>(this.data.customer.supportNotes ?? ''),
    appointments: this.fb.nonNullable.array<ApptFG>(
      (this.data.customer.appointments ?? []).map(a => this.apptGroup(a as Appointment))
    ),
  });

  // Typed convenience accessor
  get appointments(): FormArray<ApptFG> {
    return this.form.controls.appointments;
  }

  addAppointment(): void {
    this.appointments.push(this.apptGroup());
  }
  removeAppointment(i: number): void {
    this.appointments.removeAt(i);
  }

  close(): void {
    this.ref.close(undefined);
  }

  save(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();

    const normalizedAppointments = this.appointments.controls
      .map((g) => ({
        id: g.controls.id.value,
        title: g.controls.title.value,
        startsAt: this.toIso(g.controls.startsAt.value)!, // keep only with valid start
        endsAt: this.toIso(g.controls.endsAt.value ?? undefined),
        note: g.controls.note.value ?? undefined,
      }))
      .filter(x => !!x.startsAt);

    const updated: Customer = {
      ...this.data.customer,
      name: v.name,
      email: v.email ?? '',
      phone: v.phone ?? '',
      storeLocationId: v.storeLocationId,
      desiredProduct: v.desiredProduct ?? '',
      salesOwnerUserId: v.salesOwnerUserId ?? null,
      additionalDetails: v.additionalDetails ?? '',
      value: v.value ?? undefined,
      supportNotes: v.supportNotes ?? '',
      appointments: normalizedAppointments,
      updatedAt: new Date().toISOString(),
    };

    this.ref.close(updated);
  }

  private makeId(prefix: string): string {
    try { return (crypto as any).randomUUID(); } catch {}
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
