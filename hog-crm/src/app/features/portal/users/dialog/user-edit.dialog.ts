import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { mockStores } from '../../../../mock/locations.mock';
import { mockUsers } from '../../../../mock/users.mock';
import type { Role } from '../../../../types/role.types';

const ALL_ROLES: Role[] = ['OWNER','ADMIN','MANAGER','SALES','SUPPORT','SERVICE','DELIVERY','INVENTORY','CS','RENTALS'];

export interface EditDialogData { email: string; }
export interface EditUserResult {
  id: string; name: string; email: string; roles: Role[]; locationIds: string[];
}

@Component({
  standalone: true,
  selector: 'hog-user-edit-dialog',
  imports: [
    CommonModule, MatDialogModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit User</h2>
    <form *ngIf="ready" [formGroup]="form" (ngSubmit)="save()" class="col" mat-dialog-content>
      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" />
        <mat-error *ngIf="form.get('name')?.hasError('required')">Required</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" />
        <mat-error *ngIf="form.get('email')?.hasError('required')">Required</mat-error>
        <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email</mat-error>
      </mat-form-field>

       <mat-form-field appearance="outline">
        <mat-label>Roles</mat-label>
        <mat-select formControlName="roles" multiple panelClass="hog-select-panel">
            <mat-option *ngFor="let r of ALL_ROLES" [value]="r">{{ r }}</mat-option>
        </mat-select>
        <mat-error *ngIf="form.hasError('minlen')">Pick at least one</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
        <mat-label>Assigned Stores</mat-label>
        <mat-select formControlName="locationIds" multiple panelClass="hog-select-panel">
            <mat-option *ngFor="let s of stores" [value]="s.id">{{ s.name }}</mat-option>
        </mat-select>
        </mat-form-field>

    </form>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Save</button>
    </div>
  `,
  styles: [`.col{display:flex;flex-direction:column;gap:12px;min-width:520px;}.mat-mdc-form-field{width:100%;}`]
})
export class UserEditDialog {
  ALL_ROLES = ALL_ROLES;
  stores = mockStores;
  form!: FormGroup;
  ready = false;

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<UserEditDialog, EditUserResult>,
    @Inject(MAT_DIALOG_DATA) public data: EditDialogData
  ) {
    this.form = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      roles: [[] as Role[]],
      locationIds: [[] as string[]],
    }, { validators: [this.minOneRole()] });

    const u = mockUsers.find(x => x.email.toLowerCase() === data.email.toLowerCase());
    if (u) {
      this.form.patchValue({
        id: u.id, name: u.name, email: u.email,
        roles: u.roles ?? [], locationIds: u.locationIds ?? [],
      });
      this.ready = true;
    }
  }

  private minOneRole() {
    return (group: FormGroup) => {
      const arr = (group.get('roles')?.value ?? []) as Role[];
      return arr.length > 0 ? null : { minlen: true };
    };
  }

  close() { this.ref.close(); }
  save() { if (!this.form.invalid) this.ref.close(this.form.getRawValue() as EditUserResult); }
}
