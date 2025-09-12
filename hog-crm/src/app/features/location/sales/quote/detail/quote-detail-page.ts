import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatMenuModule }   from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { QuotesService } from '../quotes.service';
import { OrdersTable } from '../orders-table/orders-table';
import { FinancingTable } from '../financing-table/financing-table';

import { ContractsService, ContractData, ContractLine } from '../../../../../shared/services/contracts.service';

@Component({
  standalone: true,
  selector: 'hog-quote-detail-page',
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    OrdersTable,
    FinancingTable
  ],
  templateUrl: './quote-detail-page.html',
  styleUrls: ['./quote-detail-page.scss']
})
export class QuoteDetailPage {
  private route = inject(ActivatedRoute);
  private quotesSvc = inject(QuotesService);
  private contracts = inject(ContractsService);

  readonly quoteId = this.route.snapshot.paramMap.get('id')!;
  readonly quote   = computed(() => this.quotesSvc.byId(this.quoteId));

  // ===== Actions =====
  async printContract() {
    const q = this.quote(); if (!q) return;
    await this.contracts.print(this.mapQuoteToContract(q, 'contract'));
  }

  async downloadContract() {
    const q = this.quote(); if (!q) return;
    const data = this.mapQuoteToContract(q, 'contract');
    await this.contracts.downloadPdf(data, `Contract-${data.contractNo}.pdf`);
  }

  async downloadWorkOrder() {
    const q = this.quote(); if (!q) return;
    const data = this.mapQuoteToContract(q, 'work');
    await this.contracts.downloadPdf(data, `WorkOrder-${data.contractNo}.pdf`);
  }

  // ===== Mapping: Quote -> ContractData (defensive, no ??|| mixing) =====
  private mapQuoteToContract(q: any, kind: 'contract' | 'work'): ContractData {
    const locId =
      this.route.snapshot.paramMap.get('locId') ??
      this.route.parent?.snapshot.paramMap.get('locId') ??
      's1';

    const storeName = this.pickFirstString([q.storeName, q.locationName, 'Hartville']);

    const customerName = this.pickFirstString([
      q.customer,
      q.customerName,
      this.joinNames(q.customerFirstName, q.customerLastName),
      'Customer'
    ]);

    const repName = this.pickFirstString([
      q.ownerName,
      q.repName,
      'Sales Rep'
    ]);

    const lines = this.guessLines(q);
    const subtotal = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
    const taxRateRaw = (q.taxRate ?? (q.taxes?.rate ?? 0));
    const taxRate = Number.isFinite(Number(taxRateRaw)) ? Number(taxRateRaw) : 0;
    const tax = +(subtotal * taxRate).toFixed(2);
    const total = Number.isFinite(Number(q.total)) ? Number(q.total) : +(subtotal + tax).toFixed(2);

    const contractNo = String(this.pickFirstString([q.quoteNumber, q.id, this.quoteId]));
    const validUntilISO = this.pickFirstString([q.validUntilISO, q.validUntil, q.expiresAt]) || undefined;
    const workSchedISO  = this.pickFirstString([q.appointmentDate, q.scheduledISO]) || undefined;

    const data: ContractData = {
      contractNo,
      contractDateISO: new Date().toISOString(),
      store: {
        name: storeName,
        locationId: String(locId),
        phone: q.storePhone,
        addressLines: this.asLines(q.storeAddress)
      },
      customer: {
        name: customerName,
        email: q.customerEmail,
        phone: q.customerPhone,
        addressLines: this.asLines(q.customerAddress)
      },
      rep: {
        name: repName,
        email: q.ownerEmail ?? q.repEmail,
        phone: q.ownerPhone ?? q.repPhone
      },
      quote: {
        quoteNo: this.pickFirstString([q.quoteNumber, q.id]),
        validUntilISO
      },
      workOrder: kind === 'work' ? { scheduledISO: workSchedISO, notes: q.workNotes } : undefined,
      lines,
      terms: (Array.isArray(q.terms) && q.terms.length) ? q.terms : [
        'All sales subject to store terms & conditions.',
        'Deposits are non-refundable after 72 hours.'
      ],
      totals: {
        subtotal: +subtotal.toFixed(2),
        tax,
        total,
        deposit: Number.isFinite(Number(q.deposit)) ? +q.deposit : undefined,
        balance: Number.isFinite(Number(q.balance)) ? +q.balance : undefined
      },
      brand: 'Hartville Outdoor Group'
    };

    return data;
  }

  private guessLines(q: any): ContractLine[] {
    const raw: any[] =
      (Array.isArray(q?.lines) && q.lines) ||
      (Array.isArray(q?.items) && q.items) ||
      (Array.isArray(q?.products) && q.products) ||
      [];

    if (raw.length) {
      return raw.map((r: any) => ({
        sku: r.sku ?? r.code ?? undefined,
        description: this.pickFirstString([r.description, r.name, r.title, 'Item']),
        qty: Number(r.qty ?? r.quantity ?? 1) || 1,
        price: Number(r.price ?? r.unitPrice ?? r.amount ?? 0) || 0
      })) as ContractLine[];
    }

    // Fallback single line (if we only have a total)
    const amt = Number(q?.total ?? 0) || 0;
    return [{ description: 'Quoted Goods/Services', qty: 1, price: amt }];
  }

  // ===== Small utils =====
  private pickFirstString(vals: any[]): string {
    for (const v of vals) {
      if (typeof v === 'string' && v.trim().length) return v.trim();
    }
    return '';
  }

  private joinNames(a?: string, b?: string): string {
    const x = typeof a === 'string' ? a.trim() : '';
    const y = typeof b === 'string' ? b.trim() : '';
    return [x, y].filter(Boolean).join(' ');
  }

  private asLines(addr: any): string[] | undefined {
    if (!addr) return undefined;
    return Array.isArray(addr) ? addr.map(String) : [String(addr)];
  }
}
