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

type Case = { id:string; customer:string; channel:'Phone'|'Email'|'Web'|'In-Store'; topic:string; status:'Open'|'Pending'|'Resolved'; owner:string };

@Component({
  standalone: true,
  selector: 'hog-store-support',
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
  template: `... (unchanged template) ...`,
  styles: [`.filters,.editor{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0}.filters .spacer{flex:1 1 auto} mat-form-field{min-width:180px} table{width:100%;margin-top:8px}`]
})
export class SupportPage {
  private fb = inject(FormBuilder);

  channels: Case['channel'][] = ['Phone','Email','Web','In-Store'];
  statuses: Case['status'][] = ['Open','Pending','Resolved'];

  filters = this.fb.group({ q:[''], channel:[''], status:[''] });
  caseForm = this.fb.group({ customer:[''], topic:[''], channel:['Phone' as Case['channel']], status:['Open' as Case['status']], owner:[''] });

  cols = ['id','customer','topic','channel','status','owner'];
  dataSource = new MatTableDataSource<Case>([
    { id:'C-1001', customer:'Sara J', topic:'Delivery update', channel:'Phone', status:'Open', owner:'CS-1' },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(){ this.dataSource.paginator=this.paginator; this.dataSource.sort=this.sort; }

  applyFilters(){ /* unchanged */ }
  prefillNew(){ this.caseForm.reset({ channel:'Phone', status:'Open' }); }
  saveCase(){ /* later */ }
}
