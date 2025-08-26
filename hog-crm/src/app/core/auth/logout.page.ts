import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'hog-logout',
  template: `<p style="padding:24px">Signing out…</p>`
})
export class LogoutPage implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.auth.signOut();
    this.router.navigate(['/auth/login']);
  }
}
