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

type Rental = {
  id: string; item: string; customer: string;
  start: Date; end: Date; rate: number; status: 'Booked'|'Active'|'Returned'|'Cancelled';
};

@Component({
  standalone: true,
  selector: 'hog-store-rentals',
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule
  ],
  template: `... (unchanged template) ...`,
  styles: [`.filters,.editor{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0}.filters .spacer{flex:1 1 auto} mat-form-field{min-width:180px} table{width:100%;margin-top:8px}`]
})
export class RentalsPage {
  private fb = inject(FormBuilder);

  statuses: Rental['status'][] = ['Booked','Active','Returned','Cancelled'];

  filters = this.fb.group({ q:[''], status:[''], from:[null as Date|null], to:[null as Date|null] });
  rentalForm = this.fb.group({ item:['E-Bike Model X'], customer:[''], start:[new Date()], end:[new Date()], rate:[65], status:['Booked' as Rental['status']] });

  cols = ['item','customer','start','end','rate','status'];
  dataSource = new MatTableDataSource<Rental>([
    { id:'R1', item:'E-Bike #12', customer:'Sam P', start:new Date(), end:new Date(), rate:65, status:'Active' },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(){ this.dataSource.paginator=this.paginator; this.dataSource.sort=this.sort; }

  applyFilters(){ /* unchanged */ }
  prefillNew(){ this.rentalForm.reset({ item:'E-Bike Model X', start:new Date(), end:new Date(), rate:65, status:'Booked' }); }
  saveRental(){ /* later */ }
}
