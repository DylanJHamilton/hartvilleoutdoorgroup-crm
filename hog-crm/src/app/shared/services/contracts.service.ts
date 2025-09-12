import { Injectable } from '@angular/core';

export interface ContractParty {
  name: string;
  email?: string;
  phone?: string;
  addressLines?: string[];
}
export interface ContractLine { sku?: string; description: string; qty: number; price: number; }
export interface ContractData {
  contractNo: string;
  contractDateISO: string;
  store: { name: string; locationId: string; phone?: string; addressLines?: string[] };
  customer: ContractParty;
  rep?: ContractParty;
  quote?: { quoteNo?: string; validUntilISO?: string };
  workOrder?: { scheduledISO?: string; notes?: string };
  lines: ContractLine[];
  terms?: string[];
  totals?: { subtotal: number; tax: number; total: number; deposit?: number; balance?: number };
  brand?: string;
}

@Injectable({ providedIn: 'root' })
export class ContractsService {
  // keep a single in-flight loader so multiple clicks don’t re-import
  private pdfMakePromise?: Promise<any>;

  /** Call this early (e.g., ngOnInit) to avoid losing the user gesture on click. */
  preload(): void {
    void this.ensurePdfMake();
  }

  private async ensurePdfMake(): Promise<any> {
    if (!this.pdfMakePromise) {
      this.pdfMakePromise = (async () => {
        const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
          import('pdfmake/build/pdfmake'),
          import('pdfmake/build/vfs_fonts'),
        ]);
        (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
        return pdfMake;
      })();
    }
    return this.pdfMakePromise;
  }

  private money(n = 0) {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  private toDate(iso?: string | null) {
    return iso ? new Date(iso).toLocaleDateString() : '—';
  }

  buildDocDef(d: ContractData): any {
    const money = this.money.bind(this);
    const toDate = this.toDate.bind(this);
    return {
      pageMargins: [36, 48, 36, 48],
      defaultStyle: { fontSize: 10, color: '#0f172a' },
      styles: {
        h1: { fontSize: 16, bold: true, color: '#1d4ed8', margin: [0, 0, 0, 6] },
        h2: { fontSize: 12, bold: true, margin: [0, 12, 0, 6] },
        small: { fontSize: 9, color: '#475569' },
        tableHeader: { bold: true, fillColor: '#eef2ff' },
      },
      content: [
        {
          columns: [
            [
              { text: d.brand || 'Hartville Outdoor Group', style: 'h1' },
              { text: d.store.name, bold: true },
              ...(d.store.addressLines || []).map(t => ({ text: t, style: 'small' })),
              d.store.phone ? { text: d.store.phone, style: 'small' } : {}
            ],
            {
              width: 'auto',
              table: {
                body: [
                  ['Contract #', d.contractNo],
                  ['Date', toDate(d.contractDateISO)],
                  ['Quote #', d.quote?.quoteNo ?? '—'],
                  ['Valid Until', toDate(d.quote?.validUntilISO)]
                ]
              },
              layout: 'lightHorizontalLines'
            }
          ]
        },
        { text: 'Customer', style: 'h2' },
        {
          columns: [
            [
              { text: d.customer.name, bold: true },
              ...(d.customer.addressLines || []).map(t => ({ text: t })),
              d.customer.phone ? { text: d.customer.phone } : {},
              d.customer.email ? { text: d.customer.email } : {},
            ],
            d.rep?.name ? [
              { text: 'Sales Rep', style: 'h2' },
              { text: d.rep.name, bold: true },
              d.rep.email ? { text: d.rep.email } : {},
              d.rep.phone ? { text: d.rep.phone } : {},
            ] : []
          ]
        },
        { text: 'Items', style: 'h2' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Description', style: 'tableHeader' },
                { text: 'Qty', style: 'tableHeader' },
                { text: 'Price', style: 'tableHeader' },
                { text: 'Line Total', style: 'tableHeader' }
              ],
              ...d.lines.map(l => ([
                (l.sku ? `[${l.sku}] ` : '') + l.description,
                { text: String(l.qty), alignment: 'right' },
                { text: money(l.price), alignment: 'right' },
                { text: money(l.qty * l.price), alignment: 'right' }
              ])),
              [{ text: 'Subtotal', colSpan: 3, alignment: 'right' }, {}, {}, { text: money(d.totals?.subtotal ?? 0), alignment: 'right' }],
              [{ text: 'Tax', colSpan: 3, alignment: 'right' }, {}, {}, { text: money(d.totals?.tax ?? 0), alignment: 'right' }],
              [{ text: 'Total', colSpan: 3, alignment: 'right', bold: true }, {}, {}, { text: money(d.totals?.total ?? 0), alignment: 'right', bold: true }],
              ...(d.totals?.deposit != null ? [[{ text: 'Deposit', colSpan: 3, alignment: 'right' }, {}, {}, { text: money(d.totals.deposit), alignment: 'right' }]] : []),
              ...(d.totals?.balance != null ? [[{ text: 'Balance Due', colSpan: 3, alignment: 'right', bold: true }, {}, {}, { text: d.totals.balance != null ? money(d.totals.balance) : '—', alignment: 'right', bold: true }]] : []),
            ]
          },
          layout: 'lightHorizontalLines'
        },
        d.workOrder ? { text: 'Work Order', style: 'h2' } : {},
        d.workOrder ? {
          columns: [
            { width: 'auto', text: 'Scheduled', style: 'small' },
            { text: toDate(d.workOrder.scheduledISO) }
          ]
        } : {},
        d.workOrder?.notes ? { text: d.workOrder.notes, margin: [0, 6, 0, 0] } : {},
        (d.terms?.length ? { text: 'Terms & Conditions', style: 'h2' } : {}),
        ...(d.terms || []).map(t => ({ ul: [t] })),
        { text: ' ', margin: [0, 12, 0, 0] },
        {
          columns: [
            { width: '*', text: 'Customer Signature: ____________________________', margin: [0, 12, 12, 0] },
            { width: '*', text: 'Manager Signature:  ____________________________', margin: [12, 12, 0, 0] }
          ]
        }
      ]
    };
  }

  async openInNewTab(data: ContractData) {
    // Open a blank tab immediately to preserve the user gesture
    const popup = window.open('', '_blank');
    const pdfMake = await this.ensurePdfMake();
    pdfMake.createPdf(this.buildDocDef(data)).getBlob((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      if (popup) {
        popup.location.href = url;
      } else {
        // fallback if popup blocked
        const a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.click();
      }
    });
  }

  async print(data: ContractData) {
    const pdfMake = await this.ensurePdfMake();
    // Some browsers block programmatic print; opening tab is more reliable.
    pdfMake.createPdf(this.buildDocDef(data)).open();
  }

  async downloadPdf(data: ContractData, filename = 'contract.pdf') {
    const pdfMake = await this.ensurePdfMake();
    pdfMake.createPdf(this.buildDocDef(data)).download(filename);
  }
}
