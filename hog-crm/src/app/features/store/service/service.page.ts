import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

type Ticket = {
  id: string; subject: string; status: 'Open'|'In Progress'|'Resolved'|'Closed';
  priority: 'Low'|'Normal'|'High'|'Critical'; assignee: string; due: Date; customer: string;
};

@Component({
  standalone: true,
  selector: 'hog-store-service',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  template: `... (unchanged template) ...`,
  styles: [`.filters,.editor{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0}.filters .spacer{flex:1 1 auto} mat-form-field{min-width:180px} table{width:100%;margin-top:8px}`]
})
export class ServicePage {
  private fb = inject(FormBuilder);

  statuses: Ticket['status'][] = ['Open','In Progress','Resolved','Closed'];
  priorities: Ticket['priority'][] = ['Low','Normal','High','Critical'];

  filters = this.fb.group({ q:[''], status:[''], priority:[''] });
  ticketForm = this.fb.group({
    subject:[''], customer:[''], status:['Open' as Ticket['status']], priority:['Normal' as Ticket['priority']], assignee:[''], due:[new Date()]
  });

  cols = ['id','subject','customer','status','priority','assignee','due'];
  dataSource = new MatTableDataSource<Ticket>([
    { id:'T-241', subject:'Tune-up Cart', customer:'Mary B', status:'Open',      priority:'High',   assignee:'Tech 1', due:new Date(), },
    { id:'T-242', subject:'Shed door adjust', customer:'John D', status:'In Progress', priority:'Normal', assignee:'Tech 2', due:new Date(), },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(){ this.dataSource.paginator=this.paginator; this.dataSource.sort=this.sort; }

  applyFilters(){ /* unchanged */ }
  prefillNew(){ this.ticketForm.reset({ status:'Open', priority:'Normal', due:new Date() }); }
  saveTicket(){ /* later */ }
}
