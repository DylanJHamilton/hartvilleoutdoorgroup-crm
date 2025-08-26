import { Component, Input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavItem } from '../../shared.types';

@Component({
  standalone: true,
  selector: 'hog-side-nav',
  imports: [CommonModule, MatListModule, MatIconModule, MatDividerModule, RouterLink, RouterLinkActive],
  styles: [`
    .wrapper { width: 260px; }
    .brand { padding: 16px; }
    .title { font-weight: 600; letter-spacing: .3px; }
    .nav-link { border-radius: 8px; margin: 2px 8px; }
    .nav-link.active { background: rgba(0,0,0,.06); }
  `],
  template: `
    <div class="wrapper">
      <div class="brand">
        <div class="title">{{brand}}</div>
        <div class="mat-caption">{{subtitle}}</div>
      </div>
      <mat-divider></mat-divider>

      <mat-nav-list>
        <a *ngFor="let n of nav"
           mat-list-item class="nav-link"
           [routerLink]="n.link" routerLinkActive="active">
          <mat-icon>{{n.icon}}</mat-icon>&nbsp; {{n.label}}
        </a>
      </mat-nav-list>
    </div>
  `
})
export class SideNavComponent {
  @Input() brand = 'HOG';
  @Input() subtitle = '';
  @Input() nav: NavItem[] = [];
}
