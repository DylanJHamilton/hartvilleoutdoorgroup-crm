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
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

type Deal = {
  id: string; title: string; customer: string; pipeline: string; stage: string;
  value: number; owner: string; createdAt: Date;
};

@Component({
  standalone: true,
  selector: 'hog-store-sales',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  template: `... (unchanged template from before) ...`,
  styles: [`
    .filters, .editor { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin:12px 0; }
    .filters .spacer { flex:1 1 auto }
    mat-form-field { min-width: 180px; }
    table { width: 100%; margin-top: 8px; }
  `]
})
export class SalesPage {
  private fb = inject(FormBuilder);

  pipelines = ['Sheds','Barns','Cabins','Furniture','Swing Sets','Trampolines','Playgrounds','Golf Carts','E-Bikes'];
  stages = ['Intake','Qualified','Quoted','Won','Delivered','Lost'];

  filters = this.fb.group({
    q: [''], pipeline: [''], stage: [''], from: [null as Date|null], to: [null as Date|null]
  });
  dealForm = this.fb.group({
    title: [''], customer: [''], pipeline: ['Sheds'], stage: ['Intake'], value: [0], owner: ['']
  });

  cols = ['title','customer','pipeline','stage','value','owner','createdAt'];
  dataSource = new MatTableDataSource<Deal>([
    { id:'1', title:'10x12 Shed', customer:'John Doe', pipeline:'Sheds', stage:'Quoted', value:6999, owner:'Alice', createdAt:new Date() },
    { id:'2', title:'EZGO Cart',  customer:'Mary B',  pipeline:'Golf Carts', stage:'Intake', value:9200, owner:'Ben', createdAt:new Date() },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; }

  applyFilters() { /* unchanged */ }
  resetFilters(){ /* unchanged */ }
  prefillNew(){ this.dealForm.reset({ pipeline:'Sheds', stage:'Intake', value:0 }); }
  saveDeal(){ /* wire to API later */ }
}
