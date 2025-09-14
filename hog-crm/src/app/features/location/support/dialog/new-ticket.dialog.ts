import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { TicketPriority, TicketStatus } from '../services/support-tickets.service'; // adjust if your service path differs

@Component({
  standalone: true,
  selector: 'hog-new-ticket-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './new-ticket.dialog.html',
  styleUrls: ['./new-ticket.dialog.scss'],
})
export class NewTicketDialog {
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<NewTicketDialog, any>);

  statuses: TicketStatus[] = ['Open', 'In Progress', 'Waiting', 'Resolved', 'Closed'];
  priorities: TicketPriority[] = ['Low', 'Normal', 'High', 'Urgent'];

  form = this.fb.group({
    subject: ['', Validators.required],
    description: [''],
    status: ['Open' as TicketStatus, Validators.required],
    priority: ['Normal' as TicketPriority, Validators.required],
    assignedTo: [''],
  });

  close()  { this.ref.close(); }
  submit() { if (this.form.valid) this.ref.close(this.form.value); }
}
