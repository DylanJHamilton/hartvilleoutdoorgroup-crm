import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { NavItem } from '../../shared.types';

@Component({
  standalone: true,
  selector: 'hog-side-nav',
  host: { class: 'hog-portal-light location-scope' }, // keep light look scoped to location area
  imports: [CommonModule, MatListModule, MatIconModule, MatDividerModule, RouterLink, RouterLinkActive],
  styles: [`
    .wrapper { width: 260px; }
    .brand { padding: 16px; }
    .title { font-weight: 600; letter-spacing: .3px; }
    .nav-link { border-radius: 8px; margin: 2px 8px; }
    .nav-link.active { background: rgba(0,0,0,.06); }

    /* Location-only rail: white bg + black text/icons */
    :host-context(.location-scope) {
      background:#ffffff;
      border-right:1px solid #e5e7eb;
    }
    :host-context(.location-scope) a.nav-link[mat-list-item],
    :host-context(.location-scope) a.nav-link[mat-list-item] *,
    :host-context(.location-scope) .mat-mdc-list-item .mdc-list-item__primary-text,
    :host-context(.location-scope) .nav-label {
      color:#0f172a !important; -webkit-text-fill-color:#0f172a;
    }
    :host-context(.location-scope) .mat-mdc-list-item mat-icon {
      color:#0f172a !important; opacity:.9;
    }
    :host-context(.location-scope) a.nav-link[mat-list-item]:hover { background:#f8fafc !important; }
    :host-context(.location-scope) .mat-divider { border-top-color:#e5e7eb; }
  `],
  template: `
    <div class="wrapper">
      <div class="brand">
        <div class="title">{{ brand }}</div>
        <div class="mat-caption">{{ subtitle }}</div>
      </div>
      <mat-divider></mat-divider>

      <mat-nav-list>
        <a *ngFor="let n of nav"
           mat-list-item
           class="nav-link"
           [routerLink]="n.link"
           routerLinkActive="active">
          <mat-icon>{{ n.icon }}</mat-icon>&nbsp;
          <span class="nav-label">{{ n.label }}</span>
        </a>
      </mat-nav-list>
    </div>
  `
})
export class SideNavComponent {
  /** Top line: the org brand (always "Hartville Outdoor Group") */
  @Input() brand = 'Hartville Outdoor Group';
  /** Second line: the store name ("Hartville" | "Medina" | "Mentor") + optional " (Location)" */
  @Input() subtitle = 'Location';
  @Input() nav: NavItem[] = [];
}
