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

type Item = {
  id: string; sku: string; product: string; category: string;
  status: 'In Stock'|'Reserved'|'Out of Stock';
  qty: number; location: string; price: number;
};

@Component({
  standalone: true,
  selector: 'hog-store-inventory',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule
  ],
  template: `... (unchanged template) ...`,
  styles: [`.filters,.editor{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0}.filters .spacer{flex:1 1 auto} mat-form-field{min-width:180px} table{width:100%;margin-top:8px}`]
})
export class InventoryPage {
  private fb = inject(FormBuilder);

  categories = ['Sheds','Barns','Cabins','Furniture','Swing Sets','Trampolines','Playgrounds','Golf Carts','E-Bikes'];
  statuses: Item['status'][] = ['In Stock','Reserved','Out of Stock'];

  filters = this.fb.group({ q:[''], category:[''], status:[''] });
  itemForm = this.fb.group({ sku:[''], product:[''], category:['Sheds'], status:['In Stock' as Item['status']], qty:[0], location:['Yard'], price:[0] });

  cols = ['sku','product','category','status','qty','location','price'];
  dataSource = new MatTableDataSource<Item>([
    { id:'i1', sku:'SHD-10x12', product:'10x12 Shed', category:'Sheds', status:'In Stock', qty:3, location:'Lot A', price:6999 },
    { id:'i2', sku:'EZGO-STD',  product:'EZGO Cart',  category:'Golf Carts', status:'Reserved', qty:1, location:'Bay 2', price:9200 },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(){ this.dataSource.paginator=this.paginator; this.dataSource.sort=this.sort; }

  applyFilters(){ /* unchanged */ }
  resetFilters(){ /* unchanged */ }
  prefillNew(){ this.itemForm.reset({ category:'Sheds', status:'In Stock', qty:0, location:'Yard', price:0 }); }
  saveItem(){ /* later */ }
}
