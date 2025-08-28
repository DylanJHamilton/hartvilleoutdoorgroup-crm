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

type Delivery = {
  id: string; date: Date; route: string; status: 'Planned'|'En Route'|'Delivered'|'Failed';
  driver: string; customer: string; address: string; eta?: string;
};

@Component({
  standalone: true,
  selector: 'hog-store-delivery',
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule
  ],
  template: `... (unchanged template) ...`,
  styles: [`.filters,.editor{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0}.filters .spacer{flex:1 1 auto} mat-form-field{min-width:180px} table{width:100%;margin-top:8px}`]
})
export class DeliveryPage {
  private fb = inject(FormBuilder);

  statuses: Delivery['status'][] = ['Planned','En Route','Delivered','Failed'];

  filters = this.fb.group({ date:[null as Date|null], status:[''], driver:[''] });
  deliveryForm = this.fb.group({ date:[new Date()], route:['R1'], status:['Planned' as Delivery['status']], driver:[''], customer:[''], address:[''] });

  cols = ['date','route','status','driver','customer','address'];
  dataSource = new MatTableDataSource<Delivery>([
    { id:'D1', date:new Date(), route:'East', status:'Planned', driver:'Tom', customer:'John D', address:'123 Elm St' },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(){ this.dataSource.paginator=this.paginator; this.dataSource.sort=this.sort; }

  applyFilters(){ /* unchanged */ }
  prefillNew(){ this.deliveryForm.reset({ date:new Date(), route:'R1', status:'Planned', driver:'', customer:'', address:'' }); }
  saveDelivery(){ /* later */ }
}
