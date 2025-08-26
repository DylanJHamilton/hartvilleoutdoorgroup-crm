import { Component, Input, ViewChild } from '@angular/core';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { NavItem } from '../../shared.types';

@Component({
  standalone: true,
  selector: 'hog-app-shell',
  imports: [CommonModule, MatSidenavModule, RouterOutlet, SideNavComponent, ToolbarComponent],
  styles: [`.app{height:100vh}.content{padding:16px}`],
  template: `
    <mat-sidenav-container class="app">
      <mat-sidenav #snav mode="side" opened>
        <hog-side-nav [brand]="brand" [subtitle]="subtitle" [nav]="nav"></hog-side-nav>
      </mat-sidenav>

      <mat-sidenav-content>
        <hog-toolbar [title]="title" (menu)="snav.toggle()"></hog-toolbar>
        <div class="content"><router-outlet /></div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `
})
export class AppShellComponent {
  @ViewChild('snav') snav!: MatSidenav;
  @Input() brand = 'HOG Admin';
  @Input() subtitle = 'Material Admin';
  @Input() title = 'Hartville Outdoor Group';
  @Input() nav: NavItem[] = [];
}
