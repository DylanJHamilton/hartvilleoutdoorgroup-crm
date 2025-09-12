import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ExportDialogData {
  filename?: string;
  rows?: any[];
  columns?: string[];
  chartDataUri?: string;
}

@Component({
  standalone: true,
  selector: 'hog-export-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  styleUrls: ['./export.dialog.scss'],
  templateUrl: './export.dialog.html'
})
export class ExportDialog {
  // Init with safe defaults; populate in constructor after DI is available
  readonly fname = signal<string>('export');
  readonly colOrder = signal<string[]>([]);
  readonly chartPngUri = signal<string | null>(null);
  readonly hasChartPng = computed(() => !!this.chartPngUri());

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData,
    private ref: MatDialogRef<ExportDialog>
  ) {
    this.fname.set(this.data.filename ?? 'export');
    // take provided columns or infer from first row
    const cols = this.data.columns ?? (this.data.rows?.length ? Object.keys(this.data.rows[0]) : []);
    this.colOrder.set(cols);
    this.chartPngUri.set(this.data.chartDataUri ?? null);
  }

  close() { this.ref.close(); }

  exportCsv() {
    const rows = this.data.rows ?? [];
    const cols = this.colOrder();
    const header = cols.join(',');
    const body = rows.map(r => cols.map(c => this.csvCell(r[c])).join(',')).join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    this.download(url, `${this.fname()}.csv`);
  }

  downloadPng() {
    const uri = this.chartPngUri();
    if (!uri) return;
    this.download(uri, `${this.fname()}.png`);
  }

  private download(href: string, filename: string) {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (href.startsWith('blob:')) URL.revokeObjectURL(href);
  }

  private csvCell(v: unknown): string {
    if (v == null) return '';
    const s = String(v);
    const needsQuotes = /[",\n]/.test(s);
    return needsQuotes ? `"${s.replace(/"/g, '""')}"` : s;
    }
}
