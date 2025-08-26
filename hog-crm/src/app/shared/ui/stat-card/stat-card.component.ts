import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'hog-stat-card',
  imports: [CommonModule, MatCardModule, MatIconModule],
  styles: [`.delta.up{color:#2e7d32}.delta.down{color:#c62828}`],
  template: `
    <mat-card>
      <mat-card-title>
        <mat-icon *ngIf="icon" style="vertical-align:middle;margin-right:6px">{{icon}}</mat-icon>
        {{label}}
      </mat-card-title>
      <mat-card-content>
        <div style="font-size:28px;font-weight:700">{{value}}</div>
        <div *ngIf="delta!==undefined" class="delta" [class.up]="delta!>=0" [class.down]="delta!<0">
          <mat-icon inline>{{ delta!>=0 ? 'trending_up' : 'trending_down' }}</mat-icon>
          {{delta}}%
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string|number = '';
  @Input() delta?: number;
  @Input() icon?: string;
}


