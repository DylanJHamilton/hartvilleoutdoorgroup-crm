import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../auth.service';
import { LoginRedirectService } from '../login-redirect.service';
@Component({
  standalone: true,
  selector: 'hog-login',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule,                    // ✅ needed for <mat-tab-group>/<mat-tab>
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule
  ],
  styleUrl: './login.page.scss',
  template: `
        <div class="auth-page">
      <!-- LEFT: form panel -->
      <div class="auth-page__content-block">
        <div class="auth-page__content-wrapper">

          <!-- Single centered tab header (visual parity with FlatLogic) -->
          <mat-tab-group class="auth-page__group" mat-stretch-tabs>
            <mat-tab label="Login">
              <h4 class="auth-page__group-title">Welcome!</h4>

              <form [formGroup]="form" (ngSubmit)="submit()" class="form">
              <mat-form-field appearance="fill" floatLabel="always" class="form__input underline">
                <mat-label>Email Address *</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="username" />
                <mat-error *ngIf="form.controls.email.invalid && form.controls.email.touched">
                  Enter a valid email
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="fill" floatLabel="always" class="form__input underline">
                <mat-label>Password *</mat-label>
                <input matInput [type]="show ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
                <button mat-icon-button matSuffix type="button" (click)="show=!show" aria-label="Toggle password">
                  <mat-icon>{{ show ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="form.controls.password.invalid && form.controls.password.touched">
                  Password is required
                </mat-error>
              </mat-form-field>



                <div class="form-row">
                  <mat-checkbox style="color: #111;" color="primary" formControlName="remember" class="remember"
                    [style.--mdc-checkbox-selected-checkmark-color]="'#ffffff'"

                  ><span style="color:#111;">Remember me</span></mat-checkbox>
                  <a class="link" href="javascript:void(0)">Forgot password?</a>
                </div>

                <!-- Always visible, full-width login button -->
                <button mat-raised-button color="primary" class="login-btn"
                        type="submit" [disabled]="loading">
                  <ng-container *ngIf="!loading">Login</ng-container>
                  <mat-progress-spinner *ngIf="loading" diameter="18" mode="indeterminate"></mat-progress-spinner>
                </button>

                <div class="error" *ngIf="error">{{ error }}</div>
              </form>
            </mat-tab>
          </mat-tab-group>

          <!-- Left-panel copyright -->
          <footer class="auth-page__copyright">
            © {{ year }} Hartville Outdoor Group. All rights reserved.
          </footer>
        </div>
      </div>

      <!-- RIGHT: brand/blue panel (unchanged) -->
      <div class="auth-page__logo">
        <div class="auth-page__logo-wrapper">
          <h6 class="auth-page__logo-title">Hartville Outdoor Group - CRM</h6>
        </div>
      </div>
    </div>

  `
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private redirect = inject(LoginRedirectService);

  year = new Date().getFullYear();     // ✅ no “new Date()” in template

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [true],
  });

  show = false;
  loading = false;
  error = '';

  async submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = '';
    const { email, password, remember } = this.form.getRawValue();
    try {
      const user = await this.auth.signIn(email!, password!, !!remember);
      this.redirect.goHome(user);
    } catch (e: any) {
      this.error = e?.error?.message || 'Invalid credentials';
    } finally {
      this.loading = false;
    }
  }
}
