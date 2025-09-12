import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

export type Timeframe = 'DTD' | 'WTD' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM';

@Component({
  standalone: true,
  selector: 'hog-time-filter',
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, MatInputModule],
  templateUrl: './time-filter.html',
  styleUrl: './time-filter.scss',
})
export class TimeFilterComponent {
  @Input() timeframe: Timeframe = 'MTD';
  @Input() storeId: string = 'mentor';
  @Input() ownerId: string | 'ALL' = 'ALL';
  @Input() lockOwner = false;

  @Output() changed = new EventEmitter<{ timeframe: Timeframe; storeId?: string; ownerId?: string; range?: { start: Date; end: Date } | null }>();

  stores = ['mentor', 'hartville', 'akron'];
  owners = ['rep-001', 'rep-002', 'rep-003'];

  onTimeframe(tf: Timeframe) { this.timeframe = tf; this.emit(); }
  onStore(id: string)        { this.storeId = id; this.emit(); }
  onOwner(id: string)        { this.ownerId = id as any; this.emit(); }

  private emit() {
    this.changed.emit({ timeframe: this.timeframe, storeId: this.storeId, ownerId: this.ownerId });
  }
}
