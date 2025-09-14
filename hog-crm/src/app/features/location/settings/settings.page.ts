import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../types/user.types';

@Component({
  standalone: true,
  selector: 'hog-store-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
  <div class="wrap">
    <!-- Header -->
    <header class="hdr">
      <div class="hdr-left">
        <div class="avatar lg">
          <img *ngIf="avatarPreviewUrl; else avatarPh" [src]="avatarPreviewUrl" alt="Profile picture" />
          <ng-template #avatarPh><div class="avatar-ph"><mat-icon>person</mat-icon></div></ng-template>
        </div>
        <div class="meta">
          <div class="title">User Settings — {{ displayUserName }}</div>
          <div class="sub">{{ form.controls.email.value || '—' }}</div>
        </div>
      </div>
      <div class="hdr-actions">
        <button mat-stroked-button type="button" (click)="portalSettings()">
          <mat-icon>open_in_new</mat-icon><span>Open Portal Settings</span>
        </button>
      </div>
    </header>

    <!-- Tabs -->
    <form class="content" [formGroup]="form" (ngSubmit)="save('all')">
      <mat-tab-group>
        <!-- Profile -->
        <mat-tab label="Profile">
          <section class="card">
            <div class="card-hd">
              <h2>Profile</h2>
              <p>Basic information shown across this location.</p>
            </div>
            <div class="card-bd">
              <div class="profile-row">
                <div class="avatar lg">
                  <img *ngIf="avatarPreviewUrl; else avatarPh2" [src]="avatarPreviewUrl" alt="Profile picture" />
                  <ng-template #avatarPh2><div class="avatar-ph"><mat-icon>person</mat-icon></div></ng-template>
                </div>
                <div class="avatar-actions">
                  <button mat-stroked-button type="button" (click)="fileInput.click()">
                    <mat-icon>photo_camera</mat-icon><span>Change Picture</span>
                  </button>
                  <input #fileInput type="file" accept="image/*" (change)="onAvatarPicked($event)" style="display:none" />
                  <button mat-button type="button" *ngIf="avatarPreviewUrl" (click)="clearAvatar()">
                    <mat-icon>close</mat-icon><span>Remove</span>
                  </button>
                </div>
              </div>

              <div class="row">
                <mat-form-field class="full" appearance="outline">
                  <mat-label>Display name</mat-label>
                  <input matInput formControlName="name" />
                </mat-form-field>

                <mat-form-field class="full" appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" />
                </mat-form-field>

                <mat-form-field class="full" appearance="outline">
                  <mat-label>Phone</mat-label>
                  <input matInput type="tel" formControlName="phone" placeholder="(555) 123-4567" />
                </mat-form-field>
              </div>
            </div>
          </section>
        </mat-tab>

        <!-- Security -->
        <mat-tab label="Security">
          <section class="card">
            <div class="card-hd">
              <h2>Security</h2>
              <p>Update your password (demo only; hook up later).</p>
            </div>
            <div class="card-bd">
              <mat-form-field class="full" appearance="outline">
                <mat-label>New password</mat-label>
                <input matInput type="password" formControlName="password" placeholder="Leave blank to keep current" />
              </mat-form-field>
            </div>
          </section>
        </mat-tab>

        <!-- Preferences -->
        <mat-tab label="Preferences">
          <section class="card">
            <div class="card-hd">
              <h2>Preferences</h2>
              <p>Theme, density, and default formats for this location.</p>
            </div>
            <div class="card-bd">
              <div class="row">
                <mat-form-field appearance="outline">
                  <mat-label>Theme</mat-label>
                  <mat-select formControlName="theme">
                    <mat-option value="system">System</mat-option>
                    <mat-option value="light">Light</mat-option>
                    <mat-option value="dark">Dark</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Density</mat-label>
                  <mat-select formControlName="density">
                    <mat-option value="comfortable">Comfortable</mat-option>
                    <mat-option value="compact">Compact</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Time zone</mat-label>
                  <mat-select formControlName="timeZone">
                    <mat-option [value]="null">System</mat-option>
                    <mat-option value="America/New_York">America/New_York</mat-option>
                    <mat-option value="America/Chicago">America/Chicago</mat-option>
                    <mat-option value="America/Denver">America/Denver</mat-option>
                    <mat-option value="America/Los_Angeles">America/Los_Angeles</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Time format</mat-label>
                  <mat-select formControlName="timeFormat">
                    <mat-option value="h:mma">12-hour (3:45pm)</mat-option>
                    <mat-option value="HH:mm">24-hour (15:45)</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Date format</mat-label>
                  <mat-select formControlName="dateFormat">
                    <mat-option value="MM/dd/yyyy">MM/dd/yyyy</mat-option>
                    <mat-option value="dd/MM/yyyy">dd/MM/yyyy</mat-option>
                    <mat-option value="yyyy-MM-dd">yyyy-MM-dd</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>
          </section>
        </mat-tab>

        <!-- Notifications -->
        <mat-tab label="Notifications">
          <section class="card">
            <div class="card-hd">
              <h2>Notifications</h2>
              <p>Choose how we keep you in the loop.</p>
            </div>
            <div class="card-bd toggles">
              <mat-slide-toggle formControlName="notifyByEmail">Email notifications</mat-slide-toggle>
              <mat-slide-toggle formControlName="notifyBySms">SMS notifications</mat-slide-toggle>
              <mat-slide-toggle formControlName="desktop">Desktop notifications</mat-slide-toggle>
            </div>
          </section>
        </mat-tab>

        <!-- Roles (Location-scoped, READ-ONLY here) -->
        <mat-tab label="Roles">
          <section class="card">
            <div class="card-hd">
              <h2>Roles</h2>
              <p>Roles at this location (read-only here).</p>
            </div>
            <div class="card-bd">
              <mat-form-field class="full" appearance="outline">
                <mat-label>Location Roles</mat-label>
                <!-- Explicit boolean bindings to satisfy strict template checking -->
                <mat-select formControlName="roles" [multiple]="true" [disabled]="true">
                  <mat-option *ngFor="let r of allRoles" [value]="r">{{ r }}</mat-option>
                </mat-select>
              </mat-form-field>
              <div class="hint">Managed elsewhere. Changes are disabled in this section.</div>
            </div>
          </section>
        </mat-tab>
      </mat-tab-group>

      <!-- Sticky actions -->
      <div class="bar">
        <div class="bar-inner">
          <span class="muted">Review changes before saving</span>
          <div class="actions">
            <button mat-stroked-button type="button" (click)="reset()">Cancel</button>
            <button mat-flat-button color="primary" type="submit">Save Changes</button>
          </div>
        </div>
      </div>
    </form>
  </div>
  `,
  styles: [`
    /* Force all typography to dark text */
    :host {
      color: rgba(0,0,0,.87) !important;
    }

    /* Headings */
    :host h1, :host h2, :host h3, :host h4, :host h5, :host h6 {
      color: rgba(0,0,0,.87) !important;
    }

    /* Card headers and descriptions */
    :host .card-hd h2,
    :host .card-hd p,
    :host .meta .title,
    :host .meta .sub {
      color: rgba(0,0,0,.87) !important;
    }

    /* Material form labels + inputs */
    :host .mat-mdc-form-field .mdc-floating-label,
    :host .mat-mdc-form-field .mdc-floating-label--float-above,
    :host .mat-mdc-input-element,
    :host .mat-mdc-select-value-text,
    :host .mat-mdc-option {
      color: rgba(0,0,0,.87) !important;
    }

    /* Tab labels */
    :host ::ng-deep .mat-mdc-tab .mdc-tab__text-label {
      color: rgba(0,0,0,.87) !important;
      font-weight: 600;
    }

    /* Active tab underline → primary */
    :host ::ng-deep .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
      color: var(--primary) !important;
    }
    :host ::ng-deep .mat-mdc-tab-indicator__content--underline {
      border-color: var(--primary) !important;
    }

    /* Slide toggle labels */
    :host ::ng-deep .mat-mdc-slide-toggle .mdc-label {
      color: rgba(0,0,0,.87) !important;
    }

    :host{ --primary:#2563eb; --bg:#f6f7fb; --card:#fff; --border:rgba(0,0,0,.08); --muted:rgba(0,0,0,.62) }
    .wrap{padding:16px;background:var(--bg)}
    .hdr{display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:16px}
    .hdr-left{display:flex;align-items:center;gap:12px}
    .meta .title{font-weight:700;font-size:18px}
    .meta .sub{color:var(--muted);font-size:12.5px}
    .avatar{width:56px;height:56px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#e9eef6}
    .avatar.lg{width:72px;height:72px}
    .avatar img{width:100%;height:100%;object-fit:cover}
    .avatar-ph mat-icon{color:#3b4a66;font-size:36px}
    .content{display:block;margin-top:12px}
    .card{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-top:12px}
    .card-hd{padding:14px 16px;border-bottom:1px solid var(--border)}
    .card-hd h2{margin:0;font-size:16px;font-weight:700}
    .card-hd p{margin:6px 0 0;color:var(--muted);font-size:12.5px}
    .card-bd{padding:16px;display:flex;flex-direction:column;gap:14px}
    .profile-row{display:flex;align-items:center;gap:16px}
    .avatar-actions{display:flex;gap:10px;flex-wrap:wrap}
    .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .full{width:100%}
    .toggles{display:flex;gap:16px;flex-wrap:wrap}
    .bar{position:sticky;bottom:0;z-index:5;margin-top:8px}
    .bar-inner{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid var(--border);border-radius:12px;padding:10px 12px}
    .muted{color:var(--muted);font-size:12.5px}
    @media (max-width: 960px){ .row{grid-template-columns:1fr} }

    /* Primary tint on UNFOCUSED fields */
    :host .mat-mdc-text-field-wrapper:not(.mdc-text-field--focused){
      background: color-mix(in srgb, var(--primary) 6%, #ffffff) !important;
    }
    :host .mdc-text-field--focused{ background:#fff !important; }
    :host .mat-mdc-form-field:hover .mdc-notched-outline__leading,
    :host .mat-mdc-form-field:hover .mdc-notched-outline__trailing,
    :host .mat-mdc-form-field:hover .mdc-notched-outline__notch{
      border-color: color-mix(in srgb, var(--primary) 35%, #0000) !important;
    }
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing,
    :host .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch{
      border-color: var(--primary) !important;
    }
  `]
})
export class SettingsPage {
  private fb = inject(FormBuilder);

  allRoles = ['OWNER','ADMIN','MANAGER','SALES','SUPPORT','CS','SERVICE','DELIVERY','RENTALS','INVENTORY'] as const;

  form = this.fb.group({
    // Profile
    name: [''],
    email: ['', [Validators.email]],
    phone: [''],

    // Security (demo)
    password: [''],

    // Preferences
    theme: ['system'],
    density: ['comfortable'],
    timeZone: [null as string | null],
    timeFormat: ['h:mma'],
    dateFormat: ['MM/dd/yyyy'],

    // Notifications
    notifyByEmail: [true],
    notifyBySms: [false],
    desktop: [true],

    // Tables & UI
    tableStriped: [true],
    tableShowAvatars: [true],
    showAdvancedPanels: [false],

    // Roles (read-only here)
    roles: [[] as string[]],
  });

  // Avatar demo state
  avatarFile: File | null = null;
  avatarPreviewUrl: string | null = null;

  get displayUserName(): string {
    const n = this.form.controls.name.value?.trim();
    return n || this.form.controls.email.value || 'User';
  }

  portalSettings(){ /* optional */ }

  onAvatarPicked(evt: Event){
    const input = evt.target as HTMLInputElement;
    if (!input?.files?.length) return;
    const file = input.files[0];
    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = () => this.avatarPreviewUrl = typeof reader.result === 'string' ? reader.result : null;
    reader.readAsDataURL(file);
  }

  clearAvatar(){ this.avatarFile = null; this.avatarPreviewUrl = null; }

  save(which:string){ console.log('[UserSettings] save', which, this.form.value); }

  reset(){
    this.form.reset({
      name: '',
      email: '',
      phone: '',
      password: '',
      theme: 'system',
      density: 'comfortable',
      timeZone: null,
      timeFormat: 'h:mma',
      dateFormat: 'MM/dd/yyyy',
      notifyByEmail: true,
      notifyBySms: false,
      desktop: true,
      tableStriped: true,
      tableShowAvatars: true,
      showAdvancedPanels: false,
      roles: []
    });
    this.avatarFile = null;
    this.avatarPreviewUrl = null;
  }
}
