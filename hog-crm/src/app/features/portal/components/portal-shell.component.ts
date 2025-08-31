import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'hog-portal-shell',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="portal">
    <header class="bar">
      <div class="brand">Hartville CRM — Portal</div>
      <div class="spacer"></div>
      <a routerLink="/portal/dashboard" routerLinkActive="active">Dashboard</a>
      <!-- Add later:
      <a routerLink="/portal/reports" routerLinkActive="active">Reports</a>
      <a routerLink="/portal/users"   routerLinkActive="active">Users</a>
      -->
    </header>

    <main class="content">
      <router-outlet/>
    </main>
  </div>
  `,
  styles: [`
    .portal { min-height:100dvh; display:flex; flex-direction:column; background:#f6f7fb; }
    .bar { height:56px; display:flex; align-items:center; gap:16px; padding:0 16px;
           background:#0f172a; color:#e2e8f0; }
    .brand { font-weight:700; }
    .spacer { flex:1; }
    a { color:#cbd5e1; text-decoration:none; padding:6px 10px; border-radius:8px; }
    a.active, a:hover { background:#1e293b; color:#fff; }
    .content { padding:16px; }
  `]
})
export class PortalShellComponent {
  // keep for future user menu / sign out, etc.
  auth = inject(AuthService);
}
