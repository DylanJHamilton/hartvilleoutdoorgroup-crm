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
import { AuthService } from './../auth.service';
import { LoginRedirectService } from './../login-redirect.service';

@Component({
  standalone: true,
  selector: 'hog-login',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule
  ],
  styleUrl: './login.page.scss', // or styleUrls: ['./login.page.scss'],
  template: `
 <div class="auth-wrap">
    <div class="auth-card">
      <!-- Brand -->
      <div class="auth-brand">
        <!-- Put your logo at assets/brand/hog-logo.svg -->
        <img src="assets/brand/hog-logo.svg" alt="Hartville Outdoor Group" />
        <h2>Sign in to Hartville CRM</h2>
        <p class="muted">Use your work email to continue</p>
      </div>

      <!-- Card -->
      <mat-card appearance="outlined" class="card">
        <form class="form" [formGroup]="form" (ngSubmit)="submit()">
          <!-- Email -->
          <mat-form-field appearance="outline" class="field">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" autocomplete="username" placeholder="you@company.com" />
            <mat-icon matSuffix>mail</mat-icon>
            <mat-error *ngIf="form.controls.email.invalid && form.controls.email.touched">
              Enter a valid email
            </mat-error>
          </mat-form-field>

          <!-- Password -->
          <mat-form-field appearance="outline" class="field">
            <mat-label>Password</mat-label>
            <input matInput [type]="show ? 'text' : 'password'" formControlName="password" autocomplete="current-password" placeholder="••••••••" />
            <button mat-icon-button matSuffix type="button" (click)="show = !show" aria-label="Toggle password">
              <mat-icon>{{ show ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.controls.password.invalid && form.controls.password.touched">
              Password is required
            </mat-error>
          </mat-form-field>

          <!-- Remember + Forgot -->
          <div class="row row-compact">
            <mat-checkbox formControlName="remember">Remember me</mat-checkbox>
            <!-- Using a plain anchor to avoid RouterModule import in this pass -->
            <a class="link" href="#">Forgot password?</a>
          </div>

          <!-- Submit -->
          <button mat-flat-button color="primary" class="btn" type="submit" [disabled]="form.invalid || loading">
            <ng-container *ngIf="!loading">Sign in</ng-container>
            <mat-progress-spinner *ngIf="loading" diameter="18" mode="indeterminate"></mat-progress-spinner>
          </button>

          <!-- Divider -->
          <div class="divider"><span>or</span></div>

          <!-- Secondary action (placeholder) -->
          <button mat-stroked-button color="primary" class="btn-alt" type="button">
            Create an account
          </button>

          <!-- Error -->
          <div class="error" *ngIf="error">{{ error }}</div>
        </form>
      </mat-card>

      <div class="auth-footer">
        <span class="muted">© Hartville Outdoor Group</span>
      </div>
    </div>
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
