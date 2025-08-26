// src/app/features/store/customers/customer-dialog.component.ts
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

export type Pipeline =
  | 'Sheds' | 'Barns' | 'Cabins' | 'Furniture' | 'Swing Sets'
  | 'Trampolines' | 'Playgrounds' | 'Golf Carts' | 'E-Bikes';
export type Stage = 'Intake' | 'Qualified' | 'Quoted' | 'Won' | 'Delivered' | 'Lost';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  interestedProduct?: string;
  pipeline?: Pipeline;
  stage?: Stage;
  owner?: string;
  createdAt: Date;
  notes?: string;
}
type DialogData = Partial<Customer> | null;

@Component({
  standalone: true,
  selector: 'hog-customer-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
  styles: [`
    .form { display:flex; flex-wrap:wrap; gap:12px; }
    mat-form-field { min-width: 220px; flex: 1 1 300px; }
    .actions { display:flex; gap:8px; justify-content:flex-end; margin-top: 12px; }
  `],
  template: `
    <h2 mat-dialog-title>{{ id ? 'Edit Customer' : 'New Customer' }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline"><mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email">
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Phone</mat-label>
          <input matInput formControlName="phone" placeholder="330-555-1100">
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Interested Product</mat-label>
          <input matInput formControlName="interestedProduct" placeholder="10x12 Shed / EZGO etc.">
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Pipeline</mat-label>
          <mat-select formControlName="pipeline">
            <mat-option *ngFor="let p of pipelines" [value]="p">{{ p }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Stage</mat-label>
          <mat-select formControlName="stage">
            <mat-option *ngFor="let s of stages" [value]="s">{{ s }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Owner</mat-label>
          <mat-select formControlName="owner">
            <mat-option *ngFor="let o of owners" [value]="o">{{ o }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="notes"><mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions class="actions">
      <button mat-stroked-button (click)="cancel()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Save</button>
    </div>
  `
})
export class CustomerDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CustomerDialogComponent, Partial<Customer> | null>, { optional: true });

  pipelines: Pipeline[] = ['Sheds','Barns','Cabins','Furniture','Swing Sets','Trampolines','Playgrounds','Golf Carts','E-Bikes'];
  stages: Stage[] = ['Intake','Qualified','Quoted','Won','Delivered','Lost'];
  owners = ['Alice','Ben','Cara','Dan']; // TODO: load from users

  id: string | undefined;

  form = this.fb.group({
    name: ['', Validators.required],
    email: [''],
    phone: [''],
    interestedProduct: [''],
    pipeline: ['Sheds' as Pipeline],
    stage: ['Intake' as Stage],
    owner: [this.owners[0]],
    notes: ['']
  });

  // Use this when opening WITHOUT MAT_DIALOG_DATA:
  @Input() set inputData(v: DialogData) { if (v) this.patch(v); }

  private patch(d: Partial<Customer>) {
    this.id = d.id;
    this.form.patchValue({
      name: d.name ?? '',
      email: d.email ?? '',
      phone: d.phone ?? '',
      interestedProduct: d.interestedProduct ?? '',
      pipeline: d.pipeline ?? ('Sheds' as Pipeline),
      stage: d.stage ?? ('Intake' as Stage),
      owner: d.owner ?? this.owners[0],
      notes: d.notes ?? ''
    });
  }

  cancel() { this.dialogRef?.close(null); }
  save()   { this.dialogRef?.close({ id: this.id, ...this.form.getRawValue() }); }
}
