import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

@Component({
  standalone: true,
  selector: 'hog-entity-table',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule],
  styles: [`table{width:100%}`],
  template: `
    <table mat-table [dataSource]="ds" matSort class="mat-elevation-z1">
      <ng-container *ngFor="let col of columns" [matColumnDef]="col">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ labels[col] || col }}</th>
        <td mat-cell *matCellDef="let row">{{ row[col] }}</td>
      </ng-container>

      <ng-container *ngIf="actions" matColumnDef="__actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let row">
          <ng-container *ngTemplateOutlet="actions; context: {$implicit: row}"></ng-container>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayed"></tr>
      <tr mat-row *matRowDef="let row; columns: displayed;"></tr>
    </table>
    <mat-paginator [pageSize]="pageSize"></mat-paginator>
  `
})
export class EntityTableComponent<T extends Record<string, any>> {
  @Input({ required: true }) columns: string[] = [];
  @Input() labels: Record<string, string> = {};
  @Input() data: T[] = [];
  @Input() pageSize = 10;
  @Input() actions?: any; // pass a <ng-template #actions="...">

  ds = new MatTableDataSource<T>([]);

  get displayed() { return [...this.columns, ...(this.actions ? ['__actions'] : [])]; }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnChanges() { this.ds.data = this.data || []; }
  ngAfterViewInit(){ this.ds.paginator = this.paginator; this.ds.sort = this.sort; }
}
