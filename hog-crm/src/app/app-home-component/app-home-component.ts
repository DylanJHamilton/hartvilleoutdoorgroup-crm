import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginPage } from '../core/auth/login/login.page';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [RouterOutlet, LoginPage],
  template: `
      <hog-login></hog-login>
  `,
  styles: [`
    .app-home{
      min-height:100vh; display:grid; place-items:center;
      background: linear-gradient(135deg,#f5f7fb 0%,#eef2f9 100%);
      padding:24px;
    }
  `]
})
export class AppHomeComponent {}
