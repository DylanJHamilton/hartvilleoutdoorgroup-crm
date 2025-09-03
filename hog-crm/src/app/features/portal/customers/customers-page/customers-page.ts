import { AfterViewInit, Component, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CustomerAddDialog } from '../dialog/customer-add.dialog';
import { CustomerEditDialog } from '../dialog/customer-edit.dialog';
import { CustomerDeletionRequestDialog, DeletionRequestResult } from '../dialog/customer-delete.dialog';
import { CustomerViewDialog } from '../dialog/customer-view.dialog';


import type { Customer } from '../../../../types/customer.types';
import { mockStores } from '../../../../mock/locations.mock';
import { mockUsers } from '../../../../mock/users.mock';
import { CustomersService } from '../customers.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { isPrivilegedGlobal, userLocationIds } from '../../../../core/auth/roles.util';

type ViewRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  storeId: string;
  storeName: string;
  desiredProduct: string;
  salesOwnerUserId: string | null;
  salesOwnerName: string;
  value?: number;
  supportNotes?: string;
  createdAt: string;
  updatedAt: string;
};

@Component({
  standalone: true,
  selector: 'hog-customers',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
  templateUrl: './customers-page.html',
  styleUrls: ['./customers-page.scss'],
})
export class CustomersPage implements AfterViewInit {
  private svc = inject(CustomersService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);

  displayedColumns = ['name', 'store', 'owner', 'product', 'value', 'note', 'actions'];
  dataSource = new MatTableDataSource<ViewRow>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit(): void {
    this.refreshTable();
  }

  applyQuickFilter(evt: KeyboardEvent): void {
    const target = evt.target as HTMLInputElement;
    this.dataSource.filter = (target.value ?? '').trim().toLowerCase();
  }

  /** Role helpers */
  get canSeePrivNav(): boolean {
    return isPrivilegedGlobal(this.auth.user());
  }
  private myStoreIds(): string[] {
    return userLocationIds(this.auth.user());
  }

  canAdd(): boolean {
    return isPrivilegedGlobal(this.auth.user()) || this.myStoreIds().length > 0; // managers allowed
  }
  canEdit(row: ViewRow): boolean {
    const user = this.auth.user();
    if (!user) return false;
    if (isPrivilegedGlobal(user)) return true;
    // managers scoped to their stores
    return this.myStoreIds().includes(row.storeId);
  }
  canDelete(row: ViewRow): boolean {
    const user = this.auth.user();
    if (!user) return false;
    // owners/admins can delete directly
    if (user.roles?.includes('OWNER') || user.roles?.includes('ADMIN')) return true;
    // managers must request deletion (button will show "Request Delete")
    return this.myStoreIds().includes(row.storeId);
  }
  isManagerScoped(row: ViewRow): boolean {
    const user = this.auth.user();
    if (!user) return false;
    return user.roles?.includes('MANAGER') && !user.roles?.some(r => r === 'OWNER' || r === 'ADMIN');
  }

  onAdd(): void {
    if (!this.canAdd()) return;
    const dlg = this.dialog.open(CustomerAddDialog, { width: '640px', disableClose: true });
    dlg.afterClosed().subscribe((result) => {
      if (!result) return;
      this.svc.create(result);
      this.refreshTable();
    });
  }

  onEdit(row: ViewRow): void {
    if (!this.canEdit(row)) return;
    const customer = this.svc.getById(row.id);
    if (!customer) return;
    const dlg = this.dialog.open(CustomerEditDialog, {
      width: '640px',
      disableClose: true,
      data: { customer }
    });
    dlg.afterClosed().subscribe((updated?: import('../../../../types/customer.types').Customer) => {
      if (!updated) return;
      this.svc.update(updated);
      this.refreshTable();
    });
  }


  onDelete(row: ViewRow): void {
    const user = this.auth.user();
    if (!user) return;

    if (user.roles?.includes('OWNER') || user.roles?.includes('ADMIN')) {
      if (!confirm(`Delete ${row.name} (${row.email})?`)) return;
      this.svc.delete(row.id);
      this.refreshTable();
      return;
    }

    if (this.isManagerScoped(row)) {
      const dlg = this.dialog.open(CustomerDeletionRequestDialog, {
        width: '560px',
        disableClose: true,
        data: { targetName: row.name }
      });
      dlg.afterClosed().subscribe((res?: DeletionRequestResult) => {
        if (!res) return;
        this.svc.requestDeletion(row.id, user.id, res.reason);
        // TODO: toast/snackbar "Request sent to admins"
      });
    }
  }

  onView(row: ViewRow): void {
  const customer = this.svc.getById(row.id);
  if (!customer) return;
  this.dialog.open(CustomerViewDialog, {
    width: '720px',
    data: { customer }
  });
}



  /** Build table model respecting role scoping */
  private refreshTable(): void {
    const user = this.auth.user();
    const stores = mockStores;
    const users = mockUsers;

    const customers = this.svc.list();

    const scoped = (() => {
      if (!user) return [];
      if (isPrivilegedGlobal(user)) return customers;
      const allowed = new Set(this.myStoreIds());
      return customers.filter(c => allowed.has(c.storeLocationId));
    })();

    const rows: ViewRow[] = scoped.map((c: Customer) => {
      const s = stores.find(x => x.id === c.storeLocationId);
      const owner = c.salesOwnerUserId ? users.find(u => u.id === c.salesOwnerUserId) : null;
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        storeId: c.storeLocationId,
        storeName: s?.name ?? 'Unknown',
        desiredProduct: c.desiredProduct,
        salesOwnerUserId: c.salesOwnerUserId ?? null,
        salesOwnerName: owner?.name ?? 'Unassigned',
        value: c.value,
        supportNotes: c.supportNotes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    this.dataSource = new MatTableDataSource<ViewRow>(rows);
    this.dataSource.paginator = this.paginator;
    this.dataSource.filterPredicate = (data: ViewRow, filter: string) => {
      const hay = `${data.name} ${data.email} ${data.phone}`.toLowerCase();
      return hay.includes(filter);
    };
  }
}
