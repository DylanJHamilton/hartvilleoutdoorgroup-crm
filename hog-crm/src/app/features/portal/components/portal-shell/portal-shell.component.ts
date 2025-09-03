import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/auth/auth.service';
import { filter } from 'rxjs/operators';
import { isPrivilegedGlobal, isHybrid } from '../../../../core/auth/roles.util';

@Component({
  standalone: true,
  selector: 'hog-portal-shell',
  imports: [
    CommonModule,
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './portal-shell.component.html',
  styleUrls: ['./portal-shell.component.scss']
})
export class PortalShellComponent {
  private router = inject(Router);
  auth = inject(AuthService);

  // State
  menuOpen = false;        // mobile nav
  userMenuOpen = false;    // user dropdown
  showSettings = false;    // placeholder toggle

  constructor() {
    // Close menus on route change
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.menuOpen = false;
        this.userMenuOpen = false;
        this.showSettings = false;
      });
  }

  get displayName(): string | null {
    const a: any = this.auth;
    const u = typeof a.user === 'function' ? a.user() : a.currentUser ?? null;
    return u?.name ?? null;
  }

  get currentUser(): any {
    const a: any = this.auth;
    return typeof a.user === 'function' ? a.user() : a.currentUser ?? null;
  }

  // --- Menu actions ---
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }
  closeUserMenu(): void {
    this.userMenuOpen = false;
  }
  closeMenu(): void {
    this.menuOpen = false;
  }

  openSettings(): void {
    // Placeholder: no route navigation yet
    this.showSettings = true;          // keep this if anything else relies on it
    this.userMenuOpen = false;
    this.menuOpen = false;
    this.router.navigate(['/portal/settings']);
  }

  

  async logout(): Promise<void> {
    try {
      const maybeLogout = (this.auth as any)?.logout;
      if (typeof maybeLogout === 'function') {
        await maybeLogout.call(this.auth);
      }
    } finally {
      // Ensure local UI state is closed before navigating
      this.menuOpen = false;
      this.userMenuOpen = false;
      this.showSettings = false;
      this.router.navigate(['/login']);
    }
  }

    get canSeePrivNav(): boolean {
    return isPrivilegedGlobal(this.auth.user());
  }
  get isHybridUser(): boolean {
    return isHybrid(this.auth.user());
  }

  // --- Global listeners ---
  @HostListener('document:keydown.escape')
  onEsc() {
    this.menuOpen = false;
    this.userMenuOpen = false;
    this.showSettings = false;
  }

  // Close dropdown when clicking anywhere else (template stops propagation internally)
  @HostListener('document:click')
  onDocClick() {
    if (this.userMenuOpen) this.userMenuOpen = false;
  }

  // Always close mobile menu on desktop widths
  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth >= 961 && this.menuOpen) this.menuOpen = false;
  }
}
