import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { LoginRedirectService } from '../../core/auth/login-redirect.service';

@Component({
  standalone: true,
  selector: 'hog-login',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule
  ],
  styles: [`
    .wrap { min-height: 100vh; display:flex; align-items:center; justify-content:center; padding:16px; }
    mat-card { width: 100%; max-width: 420px; border-radius: 14px; }
    .actions { display:flex; align-items:center; justify-content:space-between; margin-top:8px; }
    .error { color: #c62828; margin-top: 8px; font-size: 12px; }
  `],
  template: `
  <div class="wrap">
    <mat-card>
      <mat-card-header>
        <mat-card-title>Sign in</mat-card-title>
        <mat-card-subtitle>Hartville Outdoor Group CRM</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" style="width:100%">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" autocomplete="username" />
            <mat-error *ngIf="form.controls.email.invalid && form.controls.email.touched">
              Enter a valid email
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" style="width:100%">
            <mat-label>Password</mat-label>
            <input matInput [type]="show ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
            <button mat-icon-button matSuffix type="button" (click)="show=!show" aria-label="Toggle password">
              <mat-icon>{{ show ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.controls.password.invalid && form.controls.password.touched">
              Password is required
            </mat-error>
          </mat-form-field>

          <div class="actions">
            <mat-checkbox formControlName="remember">Remember me</mat-checkbox>
            <button mat-flat-button color="primary" [disabled]="form.invalid || loading">
              <ng-container *ngIf="!loading">Sign in</ng-container>
              <mat-progress-spinner *ngIf="loading" diameter="18" mode="indeterminate"></mat-progress-spinner>
            </button>
          </div>

          <div class="error" *ngIf="error">{{ error }}</div>
        </form>
      </mat-card-content>
    </mat-card>
  </div>
  `
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private redirect = inject(LoginRedirectService);

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
