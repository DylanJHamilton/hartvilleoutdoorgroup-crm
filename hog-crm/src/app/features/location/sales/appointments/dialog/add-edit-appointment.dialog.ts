import { Component, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ActivityItem, ActivityType, ActivityStatus } from '../../../../../types/sales/appointments/appointments.types';
import { ActivitiesService } from '../appointments.service';

type DialogMode = 'add' | 'edit';
interface DialogData { mode: DialogMode; value?: ActivityItem; }

@Component({
  standalone: true,
  selector: 'hog-add-edit-appointment-dialog',
  encapsulation: ViewEncapsulation.None, // let our .hog-dialog overrides reach the overlay
  imports: [
    CommonModule,
    FormsModule, ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule
  ],
  templateUrl: './add-edit-appointment.dialog.html',
  styles: [`
    :host { display:block; }
    .dlg-wrap{ position:relative; }
    .dlg-title{ margin:0 0 8px; font:700 22px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial; color:#0f172a; }
    .dlg-close{ position:absolute; top:6px; right:6px; color:#475569; }
    .dlg-content{ background:#fff; color:#0f172a; padding-top:4px; }
    .grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .full{ grid-column:1 / -1; }
    @media (max-width:640px){ .grid{ grid-template-columns:1fr; } }
    .mat-mdc-form-field .mdc-text-field{ background:#fff; border-radius:10px; height:44px; }
    .mat-mdc-form-field-infix{ padding-top:10px; padding-bottom:10px; }
    .mdc-text-field__input{ color:#0f172a !important; }
    .mat-mdc-select-value,.mat-mdc-select-value-text,.mat-mdc-select-arrow{ color:#0f172a !important; }
    .mat-mdc-form-field-subscript-wrapper{ display:none; }
    .dlg-actions{ padding-top:4px; }
    /* overlay surface light */
    .hog-dialog .mat-mdc-dialog-surface{ background:#fff !important; color:#0f172a !important; }
    .hog-dialog .mat-mdc-dialog-container{ --mdc-dialog-container-color:#fff; }
    .hog-dialog .mdc-floating-label,.hog-dialog .mdc-floating-label--float-above{ color:#334155 !important; }
  `]
})
export class AddEditAppointmentDialog {
  // ✅ inject() ensures these exist before other field initializers run
  private ref = inject(MatDialogRef<AddEditAppointmentDialog>);
  public data = inject<DialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private svc = inject(ActivitiesService);

  types: ActivityType[] = ['Call', 'Meeting', 'Task'];
  statuses: ActivityStatus[] = ['Planned', 'Completed', 'Canceled'];
  owners = this.svc.owners;

  form = this.fb.group({
    customer: ['', Validators.required],
    subject: ['', Validators.required],
    type: ['Meeting' as ActivityType, Validators.required],
    ownerId: ['', Validators.required],
    datetime: [new Date(), Validators.required],
    status: ['Planned' as ActivityStatus, Validators.required],
    notes: ['']
  });

  ngOnInit() {
    if (this.data.mode === 'edit' && this.data.value) {
      const v = this.data.value;
      this.form.setValue({
        customer: v.customer,
        subject: v.subject,
        type: v.type,
        ownerId: v.ownerId,
        datetime: new Date(v.datetime),
        status: v.status,
        notes: v.notes ?? ''
      });
    } else {
      // default owner
      if (!this.form.value.ownerId && this.owners[0]) {
        this.form.patchValue({ ownerId: this.owners[0].id });
      }
    }
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const ownerName = this.owners.find(o => o.id === v.ownerId)?.name ?? 'Unassigned';

    const payload: ActivityItem =
      this.data.mode === 'edit' && this.data.value
        ? {
            ...this.data.value,
            customer: v.customer!, subject: v.subject!, type: v.type!,
            ownerId: v.ownerId!, ownerName,
            datetime: (v.datetime as Date).toISOString(),
            status: v.status!, notes: v.notes ?? '',
            isAppointment: v.type === 'Meeting'
          }
        : {
            id: this.svc.nextId(),
            customer: v.customer!, subject: v.subject!, type: v.type!,
            ownerId: v.ownerId!, ownerName,
            datetime: (v.datetime as Date).toISOString(),
            status: v.status!, notes: v.notes ?? '',
            isAppointment: v.type === 'Meeting'
          };

    this.ref.close(payload);
  }
}
