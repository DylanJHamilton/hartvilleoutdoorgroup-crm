import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
// NOTE: NavItem is still fine; we accept "children" dynamically, so keep input typed as any[].
import { NavItem } from '../../shared.types';

@Component({
  standalone: true,
  selector: 'hog-side-nav',
  host: { class: 'hog-portal-light location-scope' }, // keep light look scoped to location area
  imports: [CommonModule, MatListModule, MatIconModule, MatDividerModule, RouterLink, RouterLinkActive],
  styles: [`
       .wrapper { width: 260px; min-height: 100%; display: flex; flex-direction: column; }
  .brand { padding: 16px; }
  .title { font-weight: 600; letter-spacing: .3px; }
  .nav-link { border-radius: 8px; margin: 2px 8px; }
  .nav-link.active { background: rgba(0,0,0,.06); }

  :host-context(.location-scope) { background:#ffffff; border-right:1px solid #e5e7eb; }
  :host-context(.location-scope) a.nav-link[mat-list-item],
  :host-context(.location-scope) a.nav-link[mat-list-item] *,
  :host-context(.location-scope) .mat-mdc-list-item .mdc-list-item__primary-text,
  :host-context(.location-scope) .nav-label { color:#0f172a !important; -webkit-text-fill-color:#0f172a; }
  :host-context(.location-scope) .mat-mdc-list-item mat-icon { color:#0f172a !important; opacity:.9; }
  :host-context(.location-scope) a.nav-link[mat-list-item]:hover { background:#f8fafc !important; }
  :host-context(.location-scope) .mat-divider { border-top-color:#e5e7eb; }

  /* let the list take remaining height and scroll if needed */
  mat-nav-list { flex: 1 1 auto; overflow-y: auto; padding-bottom: 8px; }

  /* submenu bits (if you kept the collapsible groups) */
  .group-header { display:flex; align-items:center; cursor:pointer; }
  .chev { transition: transform .15s ease; margin-right:4px; }
  .chev.open { transform: rotate(180deg); }
  .group-icon { margin-right:4px; }
  .submenu { padding-left: 28px; }
  .child-link { margin-left: 0; }
  `],
  template: `
    <div class="wrapper">
      <div class="brand">
        <div class="title">{{ brand }}</div>
        <div class="mat-caption">{{ subtitle }}</div>
      </div>
      <mat-divider></mat-divider>

      <mat-nav-list>
        <ng-container *ngFor="let n of nav; trackBy: trackById">
          <!-- Group with children -->
          <div *ngIf="n.children?.length; else leaf" class="group">
            <a mat-list-item class="nav-link group-header"
               (click)="toggle(n)"
               [attr.aria-expanded]="isOpen(n)">
              <mat-icon class="chev" [class.open]="isOpen(n)">expand_more</mat-icon>
              <mat-icon class="group-icon">{{ n.icon }}</mat-icon>
              <span class="nav-label">{{ n.label }}</span>
            </a>
            <div class="submenu" *ngIf="isOpen(n)">
              <a *ngFor="let c of n.children; trackBy: trackById"
                 mat-list-item
                 class="nav-link child-link"
                 [routerLink]="c.link"
                 routerLinkActive="active">
                <mat-icon>{{ c.icon }}</mat-icon>&nbsp;
                <span class="nav-label">{{ c.label }}</span>
              </a>
            </div>
          </div>

          <!-- Leaf -->
          <ng-template #leaf>
            <a mat-list-item class="nav-link" [routerLink]="n.link" routerLinkActive="active">
              <mat-icon>{{ n.icon }}</mat-icon>&nbsp;
              <span class="nav-label">{{ n.label }}</span>
            </a>
          </ng-template>
        </ng-container>
      </mat-nav-list>
    </div>
  `
})
export class SideNavComponent implements OnChanges {
  /** Top line: the org brand (always "Hartville Outdoor Group") */
  @Input() brand = 'Hartville Outdoor Group';
  /** Second line: the store name ("Hartville" | "Medina" | "Mentor") + optional " (Location)" */
  @Input() subtitle = 'Location';
  // Accept children too; keep external type flexible
  @Input() nav: any[] = [];

  private open = new Set<string>();

  ngOnChanges() {
    // Open any groups by default (nice on desktop)
    (this.nav ?? []).forEach((n: any) => {
      if (n?.children?.length) this.open.add(n.id ?? n.label);
    });
  }

  trackById = (_: number, item: any) => item?.id ?? item?.label ?? _;
  toggle(n: any) {
    const id = n?.id ?? n?.label;
    if (!id) return;
    if (this.open.has(id)) this.open.delete(id); else this.open.add(id);
  }
  isOpen(n: any) { return this.open.has(n?.id ?? n?.label); }
}
