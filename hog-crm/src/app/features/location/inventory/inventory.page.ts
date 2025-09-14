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
  template: `
  <div class="page-wrap">
    <!-- Header -->
    <header class="page-hd">
      <h1>Inventory — {{ storeName }}</h1>
      <div class="hd-actions">
        <button mat-stroked-button color="primary" (click)="prefillNew()">
          <mat-icon>add</mat-icon> New Item
        </button>
      </div>
    </header>

    <!-- KPIs -->
    <section class="kpis">
      <div class="kpi">
        <div class="kpi-num">{{ totalCount }}</div>
        <div class="kpi-label">Total Items</div>
      </div>
      <div class="kpi">
        <div class="kpi-num">{{ inStockCount }}</div>
        <div class="kpi-label">In Stock</div>
      </div>
      <div class="kpi">
        <div class="kpi-num">{{ reservedCount }}</div>
        <div class="kpi-label">Reserved</div>
      </div>
      <div class="kpi warn">
        <div class="kpi-num">{{ oosCount }}</div>
        <div class="kpi-label">Out of Stock</div>
      </div>
    </section>

    <!-- Filters -->
    <section class="card">
      <div class="filters">
        <mat-form-field appearance="outline" class="q-field">
          <mat-label>Search (sku/product, tokens: status:*, category:*)</mat-label>
          <input matInput placeholder="e.g. status:Reserved sku:EZGO" [value]="filters.controls.q.value" (input)="onQ($event)">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select [value]="filters.controls.category.value" (selectionChange)="onCategory($event.value)">
            <mat-option [value]="''">All</mat-option>
            <mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [value]="filters.controls.status.value" (selectionChange)="onStatus($event.value)">
            <mat-option [value]="''">All</mat-option>
            <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
          </mat-select>
        </mat-form-field>

        <span class="spacer"></span>

        <button mat-stroked-button color="primary" (click)="resetFilters()">
          <mat-icon>clear</mat-icon> Clear
        </button>
      </div>
    </section>

    <!-- Table -->
    <section class="card">
      <table mat-table [dataSource]="dataSource" matSort class="inv-table">
        <!-- SKU -->
        <ng-container matColumnDef="sku">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>SKU</th>
          <td mat-cell *matCellDef="let row">{{ row.sku }}</td>
        </ng-container>

        <!-- Product -->
        <ng-container matColumnDef="product">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Product</th>
          <td mat-cell *matCellDef="let row">{{ row.product }}</td>
        </ng-container>

        <!-- Category -->
        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
          <td mat-cell *matCellDef="let row">{{ row.category }}</td>
        </ng-container>

        <!-- Status -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
          <td mat-cell *matCellDef="let row">
            <span class="chip" [class.ok]="row.status==='In Stock'" [class.warn]="row.status==='Reserved'" [class.danger]="row.status==='Out of Stock'">
              {{ row.status }}
            </span>
          </td>
        </ng-container>

        <!-- Qty -->
        <ng-container matColumnDef="qty">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Qty</th>
          <td mat-cell *matCellDef="let row">{{ row.qty }}</td>
        </ng-container>

        <!-- Location -->
        <ng-container matColumnDef="location">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Location</th>
          <td mat-cell *matCellDef="let row">{{ row.location }}</td>
        </ng-container>

        <!-- Price -->
        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Price</th>
          <td mat-cell *matCellDef="let row">\${{ row.price | number:'1.0-0' }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="cols" class="table-header"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;" (click)="open(row)"></tr>
      </table>

      <mat-paginator [pageSize]="10" [pageSizeOptions]="[10,25,50]"></mat-paginator>
    </section>

    <!-- Inline Editor (stub) -->
    <section class="card editor">
      <div class="editor-hd">
        <h2>Quick Add</h2>
        <button mat-button color="primary" (click)="prefillNew()"><mat-icon>refresh</mat-icon> Reset</button>
      </div>
      <div class="editor-row">
        <mat-form-field appearance="outline">
          <mat-label>SKU</mat-label>
          <input matInput [formControl]="itemForm.controls.sku">
        </mat-form-field>

        <mat-form-field appearance="outline" class="grow">
          <mat-label>Product</mat-label>
          <input matInput [formControl]="itemForm.controls.product">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select [formControl]="itemForm.controls.category">
            <mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="itemForm.controls.status">
            <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="sm">
          <mat-label>Qty</mat-label>
          <input matInput type="number" [formControl]="itemForm.controls.qty">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Location</mat-label>
          <input matInput [formControl]="itemForm.controls.location">
        </mat-form-field>

        <mat-form-field appearance="outline" class="sm">
          <mat-label>Price</mat-label>
          <input matInput type="number" [formControl]="itemForm.controls.price">
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="saveItem()">
          <mat-icon>save</mat-icon> Save
        </button>
      </div>
    </section>
  </div>
  `,
  styles: [`
    :host{ --primary:#2563eb; --slate:#0f172a; --muted:#64748b; --card:#fff; --border:#e2e8f0; --bg:#f6f7fb }
    .page-wrap{ padding:16px; background:var(--bg); color:var(--slate) }
    .page-hd{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px }
    .page-hd h1{ font-size:22px; font-weight:700; color:var(--slate); margin:0 }
    .kpis{ display:grid; gap:12px; grid-template-columns: repeat(4, minmax(0,1fr)); margin-bottom:12px }
    .kpi{ background:var(--card); border:1px solid var(--border); border-radius:14px; padding:16px }
    .kpi .kpi-num{ font-size:24px; font-weight:800; color:var(--slate) }
    .kpi .kpi-label{ color:var(--muted); font-weight:600 }
    .kpi.warn .kpi-num{ color:#b91c1c }

    .card{ background:var(--card); border:1px solid var(--border); border-radius:12px; padding:12px; margin-bottom:12px }
    .filters{ display:flex; flex-wrap:wrap; gap:12px; align-items:center }
    .filters .q-field{ flex:1 1 420px; min-width:260px }
    .filters .spacer{ flex:1 1 auto }
    .editor{ padding:12px }
    .editor-hd{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px }
    .editor-row{ display:grid; grid-template-columns: 1.2fr 2fr 1.2fr 1.2fr .8fr 1.2fr .8fr auto; gap:12px; align-items:end }
    .grow{ min-width:220px }
    .sm{ max-width:140px }

    table.inv-table{ width:100%; background:#fff; border-radius:12px; overflow:hidden; border:1px solid var(--border) }
    .table-header th{ background: var(--primary); color:#fff; font-weight:700 }
    td{ color:var(--slate) }

    .chip{ padding:2px 8px; border-radius:999px; font-size:12px; font-weight:700; border:1px solid var(--border); display:inline-block }
    .chip.ok{ background:#ecfdf5; color:#065f46; border-color:#a7f3d0 }
    .chip.warn{ background:#fff7ed; color:#9a3412; border-color:#fed7aa }
    .chip.danger{ background:#fef2f2; color:#991b1b; border-color:#fecaca }

    /* Inputs readable + outline behavior */
    :host .mat-mdc-text-field-wrapper{ background:#fff }
    :host .mat-mdc-form-field:hover .mdc-notched-outline__leading,
    :host .mat-mdc-form-field:hover .mdc-notched-outline__trailing,
    :host .mat-mdc-form-field:hover .mdc-notched-outline__notch{ border-color:#cbd5e1 }
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing,
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch{ border-color: var(--primary) }

    /* Row hover */
    tr.mat-mdc-row:hover { background:#f8fafc; cursor:pointer }
  `]
})
export class InventoryPage {
  private fb = inject(FormBuilder);

  // fake store label for header; wire to real store signal if you have it
  storeName = 'Hartville';

  categories = ['Sheds','Barns','Cabins','Furniture','Swing Sets','Trampolines','Playgrounds','Golf Carts','E-Bikes'];
  statuses: Item['status'][] = ['In Stock','Reserved','Out of Stock'];

  filters = this.fb.group({ q:[''], category:[''], status:[''] });
  itemForm = this.fb.group({ sku:[''], product:[''], category:['Sheds'], status:['In Stock' as Item['status']], qty:[0], location:['Yard'], price:[0] });

  cols = ['sku','product','category','status','qty','location','price'];
  dataSource = new MatTableDataSource<Item>([
    { id:'i1', sku:'SHD-10x12', product:'10x12 Shed', category:'Sheds',        status:'In Stock',   qty:3, location:'Lot A',  price:6999 },
    { id:'i2', sku:'EZGO-STD',  product:'EZGO Cart',   category:'Golf Carts',  status:'Reserved',   qty:1, location:'Bay 2',  price:9200 },
    { id:'i3', sku:'CAB-12x16', product:'12x16 Cabin', category:'Cabins',      status:'Out of Stock', qty:0, location:'—',     price:15999 },
    { id:'i4', sku:'EB-TRK',    product:'Trail E-Bike',category:'E-Bikes',     status:'In Stock',   qty:7, location:'Showroom', price:1299 },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // KPI getters reflect current filtered data
  get totalCount()   { return this.dataSource.filteredData.length || this.dataSource.data.length; }
  get inStockCount() { return this.currentRows().filter(i => i.status==='In Stock').length; }
  get reservedCount(){ return this.currentRows().filter(i => i.status==='Reserved').length; }
  get oosCount()     { return this.currentRows().filter(i => i.status==='Out of Stock').length; }
  private currentRows(){ return (this.dataSource.filteredData.length ? this.dataSource.filteredData : this.dataSource.data); }

  ngAfterViewInit(){
    this.dataSource.paginator=this.paginator;
    this.dataSource.sort=this.sort;

    // Custom filtering: tokens + dropdowns
    this.dataSource.filterPredicate = (row: Item, raw: string) => {
      const f = JSON.parse(raw || '{}') as { q?: string; category?: string; status?: string; };
      const q = (f.q || '').trim().toLowerCase();

      // token parsing in q: status:*, category:*
      let tokenStatus = '', tokenCategory = '', free = q;
      q.split(/\s+/).forEach(part => {
        const [k,v] = part.split(':');
        if (v && /^(status|category)$/i.test(k)) {
          if (k.toLowerCase()==='status') tokenStatus = v.toLowerCase();
          if (k.toLowerCase()==='category') tokenCategory = v.toLowerCase();
          free = free.replace(part,'').trim();
        }
      });

      const matchFree = !free || [row.sku,row.product].some(s => s.toLowerCase().includes(free));
      const matchCat  = (f.category ? row.category===f.category : true) &&
                        (tokenCategory ? row.category.toLowerCase().includes(tokenCategory) : true);
      const matchStat = (f.status ? row.status===f.status : true) &&
                        (tokenStatus ? row.status.toLowerCase().includes(tokenStatus) : true);

      return matchFree && matchCat && matchStat;
    };

    this.applyFilters(); // initial render
  }

  // --- Filters wiring
  onQ(evt: Event){
    const v = (evt.target as HTMLInputElement).value ?? '';
    this.filters.patchValue({ q: v }, { emitEvent:false });
    this.applyFilters();
  }
  onCategory(v: string){
    this.filters.patchValue({ category: v }, { emitEvent:false });
    this.applyFilters();
  }
  onStatus(v: string){
    this.filters.patchValue({ status: v }, { emitEvent:false });
    this.applyFilters();
  }

  applyFilters(){
    const f = this.filters.value;
    this.dataSource.filter = JSON.stringify({ q: f.q || '', category: f.category || '', status: f.status || '' });
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  resetFilters(){
    this.filters.reset({ q:'', category:'', status:'' }, { emitEvent:false });
    this.applyFilters();
  }

  prefillNew(){
    this.itemForm.reset({ sku:'', product:'', category:'Sheds', status:'In Stock', qty:0, location:'Yard', price:0 });
  }

  saveItem(){
    // stub add (not persisted)
    const v = this.itemForm.value;
    if (!v.sku || !v.product) return;
    const newItem: Item = {
      id: 'i' + (this.dataSource.data.length + 1),
      sku: String(v.sku), product: String(v.product),
      category: String(v.category), status: v.status as Item['status'],
      qty: Number(v.qty ?? 0), location: String(v.location ?? ''), price: Number(v.price ?? 0)
    };
    this.dataSource.data = [newItem, ...this.dataSource.data];
    this.prefillNew();
    this.applyFilters();
  }

  open(row: Item){
    // stub detail
    console.log('open item', row);
    // e.g., snackbar('Detail coming soon');
  }
}
