import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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
  private readonly platformId = inject(PLATFORM_ID);

  /** Call this early (e.g., ngOnInit) to avoid losing the user gesture on click. */
  preload(): void {
    void this.ensurePdfMake();
  }

  /**
   * Dynamically loads pdfmake in browser environments.
   * - Handles Vercel/esbuild resolution quirks by falling back to explicit ".js" paths.
   * - Guards against non-browser (future SSR) by returning a no-op shim.
   */
  private async ensurePdfMake(): Promise<any> {
    if (this.pdfMakePromise) return this.pdfMakePromise;

    // If not in the browser, return a no-op shim so callers don’t crash.
    if (!isPlatformBrowser(this.platformId)) {
      this.pdfMakePromise = Promise.resolve({
        createPdf() {
          // minimal chain-compatible shim: open(), print(), download(), getBlob(cb)
          return {
            open() {/* no-op */},
            print() {/* no-op */},
            download(_: string) {/* no-op */},
            getBlob(cb: (b: Blob) => void) { cb(new Blob()); }
          };
        }
      });
      return this.pdfMakePromise;
    }

    this.pdfMakePromise = (async () => {
      let pdfMakeModule: any;
      let pdfFontsModule: any;

      // First try without extension; fall back to explicit .js if needed.
      try {
        [pdfMakeModule, pdfFontsModule] = await Promise.all([
          import('pdfmake/build/pdfmake'),
          import('pdfmake/build/vfs_fonts'),
        ]);
      } catch {
        [pdfMakeModule, pdfFontsModule] = await Promise.all([
          import('pdfmake/build/pdfmake.js'),
          import('pdfmake/build/vfs_fonts.js'),
        ]);
      }

      const pdfMake: any  = pdfMakeModule?.default ?? pdfMakeModule;
      const fonts: any    = pdfFontsModule?.default ?? pdfFontsModule;

      // pdfmake vfs can be exposed in different shapes depending on bundler
      pdfMake.vfs = fonts?.pdfMake?.vfs ?? fonts?.vfs ?? pdfMake.vfs;

      return pdfMake;
    })();

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
    const pdfMake = await this.ensurePdfMake();
    // Open a blank tab immediately to preserve the user gesture (browser only).
    const popup = isPlatformBrowser(this.platformId) ? window.open('', '_blank') : null;

    pdfMake.createPdf(this.buildDocDef(data)).getBlob((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      if (popup) {
        popup.location.href = url;
      } else if (isPlatformBrowser(this.platformId)) {
        // fallback if popup blocked
        const a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.click();
      }
    });
  }

  async print(data: ContractData) {
    const pdfMake = await this.ensurePdfMake();
    pdfMake.createPdf(this.buildDocDef(data)).open();
  }

  async downloadPdf(data: ContractData, filename = 'contract.pdf') {
    const pdfMake = await this.ensurePdfMake();
    pdfMake.createPdf(this.buildDocDef(data)).download(filename);
  }
}
