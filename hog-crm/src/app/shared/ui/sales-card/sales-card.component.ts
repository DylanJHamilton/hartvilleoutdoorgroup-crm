import { Component, HostBinding, Inject, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface SalesCardData {
  id: number;
  customer: string;
  title: string;
  pipeline: 'Sheds'|'Golf Carts'|'Cabins'|'Playsets'|'Furniture'|string;
  stage: 'Lead'|'Qualified'|'Quoted'|'Won'|'Lost';
  value: number;
  owner: string;
  age: number; // days in stage
}

@Component({
  standalone: true,
  selector: 'hog-sales-card',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './sales-card.component.html',
  styleUrls: ['./sales-card.component.scss'],
})
export class SalesCardComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SalesCardData,
    public ref: MatDialogRef<SalesCardComponent, { moveTo?: SalesCardData['stage'] }>,
  ) {}

  /** Force dark UI on light bg */
  @Input() darkOnLight = true;
  @HostBinding('class.dark-on-light') get hostDarkOnLight() { return this.darkOnLight; }

  vm = computed(() => this.data);

  // Deterministic demo contact info
  email = computed(() => `customer${this.data.id}@example.com`);
  phone = computed(() => {
    const tail = String(Number(this.data.id) % 100).padStart(2, '0');
    return `330-555-01${tail}`;
  });

  initials = computed(() => {
    const n = (this.data.customer || '').trim();
    if (!n) return 'NA';
    const parts = n.split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() ?? '').join('') || 'NA';
  });

  close(result?: { moveTo?: SalesCardData['stage'] }) { this.ref.close(result); }

  // Actions (stubbed)
  call()  { console.log('Call',  this.vm().customer, this.phone()); }
  text()  { console.log('Text',  this.vm().customer, this.phone()); }
  emailC(){ console.log('Email', this.vm().customer, this.email()); }
  openRecord(){ console.log('Open record', this.vm().id); }

  // Emit a simple "cycle to next" as example move (you can replace with select UI later)
  moveStage(){
    const order: SalesCardData['stage'][] = ['Lead','Qualified','Quoted','Won','Lost'];
    const cur = this.vm().stage;
    const next = order[(order.indexOf(cur)+1) % order.length];
    this.close({ moveTo: next });
  }
}
