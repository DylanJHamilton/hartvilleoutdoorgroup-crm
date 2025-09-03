import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import type { Customer } from '../../../../types/customer.types';
import { mockStores } from '../../../../mock/locations.mock';
import { mockUsers } from '../../../../mock/users.mock';

@Component({
  standalone: true,
  selector: 'hog-customer-add-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
  <h2 mat-dialog-title>Add Customer</h2>
  <div mat-dialog-content [formGroup]="form" class="grid g16">
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
  </div>

  <div mat-dialog-actions align="end">
    <button mat-button (click)="close()">Cancel</button>
    <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
  </div>
  `,
  styles: [`
    .grid { display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); }
    .g16 { gap:16px; }
    .full { grid-column: 1 / -1; }
  `]
})
export class CustomerAddDialog {
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<CustomerAddDialog, Customer | undefined>);

  stores = mockStores;
  users = mockUsers;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.email]],
    phone: [''],
    storeLocationId: ['', [Validators.required]],
    desiredProduct: [''],
    salesOwnerUserId: <string | null>null,
    additionalDetails: [''],
    value: <number | null>null,
    supportNotes: [''],
  });

  close(): void {
    this.ref.close(undefined);
  }

  private makeId(): string {
    try { return (crypto as any).randomUUID(); } catch {}
    return 'cust_' + Math.random().toString(36).slice(2, 10);
  }

  save(): void {
    if (this.form.invalid) return;
    const now = new Date().toISOString();
    const v = this.form.getRawValue();
    const customer: Customer = {
      id: this.makeId(),
      name: v.name,
      email: v.email ?? '',
      phone: v.phone ?? '',
      storeLocationId: v.storeLocationId,
      desiredProduct: v.desiredProduct ?? '',
      salesOwnerUserId: v.salesOwnerUserId ?? null,
      additionalDetails: v.additionalDetails ?? '',
      value: v.value ?? undefined,
      supportNotes: v.supportNotes ?? '',
      appointments: [],
      createdAt: now,
      updatedAt: now,
    };
    this.ref.close(customer);
  }
}
