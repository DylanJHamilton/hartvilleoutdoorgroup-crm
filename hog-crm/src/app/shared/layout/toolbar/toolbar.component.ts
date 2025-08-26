import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'hog-toolbar',
  imports: [CommonModule, MatToolbarModule, MatIconModule, MatButtonModule, RouterLink],
  styles: [`.brand{font-weight:600;}`],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="menu.emit()"><mat-icon>menu</mat-icon></button>
      <span class="brand">{{title}}</span>
      <span style="flex:1 1 auto"></span>
      <button *ngIf="showNotifications" mat-icon-button><mat-icon>notifications</mat-icon></button>
      <button *ngIf="showAccount" mat-icon-button routerLink="/auth/logout" aria-label="Logout">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
  `
})
export class ToolbarComponent {
  @Input() title = 'Hartville Outdoor Group';
  @Input() showNotifications = true;
  @Input() showAccount = true;
  @Output() menu = new EventEmitter<void>();
}
