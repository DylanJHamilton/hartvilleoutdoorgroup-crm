import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import type { User } from '../../../../types/user.types';
import type { LocationRef } from '../../../../mock/locations.mock';
import { ToastService } from '../../../../shared/services/toast.service';

// ✅ only AuthService needed
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'hog-user-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    // Material
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  templateUrl: './user-settings.html',
  styleUrls: ['./user-settings.scss'],
})
export class UserSettingsComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  /** Inputs (optional overrides) */
  @Input() inputUser: User | null = null;
  @Input() inputLocations: LocationRef[] = [];
  @Input() context: 'portal' | 'location' = 'portal';

  /** Effective current user */
  get user(): User | null {
    return this.inputUser ?? this.auth.user() ?? null;
  }

  /** Effective locations (fallback = just Inputs) */
  get locations(): LocationRef[] {
    return this.inputLocations ?? [];
  }

  /** Outputs */
  @Output() save = new EventEmitter<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    password?: string | null;
    avatarFile?: File | null;
    avatarRemoved?: boolean;
    settings: any;
  }>();
  @Output() cancel = new EventEmitter<void>();

  /** Form */
  form: FormGroup = this.fb.group({
    name: [''],
    email: ['', [Validators.email]],
    phone: [''],
    password: [''],

    // preferences
    theme: ['system'],
    density: ['comfortable'],
    defaultLanding: ['portal-dashboard'],
    defaultLocationId: [null],
    timeZone: [null],
    timeFormat: ['h:mma'],
    dateFormat: ['MM/dd/yyyy'],

    // notifications
    notifyByEmail: [true],
    notifyBySms: [false],

    // tables & ui
    tableStriped: [true],
    tableShowAvatars: [true],
    showAdvancedPanels: [false],
  });

  /** Avatar state */
  avatarFile: File | null = null;
  avatarPreviewUrl: string | null = null;
  private avatarRemoved = false;

  readonly portalSettingsRoute = ['/portal/settings'];

  get allowedDefaultLocationOptions(): LocationRef[] {
    const ids = this.user?.locationIds ?? [];
    if (!ids.length) return this.locations ?? [];
    const map = new Set(ids);
    return (this.locations ?? []).filter(l => map.has(l.id));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inputUser'] || !this.form.get('email')?.value) {
      this.patchFromUser(this.user);
    }
  }

  private patchFromUser(u: User | null | undefined) {
    if (!u) return;
    this.form.patchValue({
      name: u.name ?? '',
      email: u.email ?? '',
      phone: (u as any).phone ?? '',

      theme: u.settings?.theme ?? 'system',
      density: u.settings?.density ?? 'comfortable',
      defaultLanding: u.settings?.defaultLanding ?? 'portal-dashboard',
      defaultLocationId: u.settings?.defaultLocationId ?? null,
      timeZone: u.settings?.timeZone ?? null,
      timeFormat: u.settings?.timeFormat ?? 'h:mma',
      dateFormat: u.settings?.dateFormat ?? 'MM/dd/yyyy',

      notifyByEmail: u.settings?.notifyByEmail ?? true,
      notifyBySms: u.settings?.notifyBySms ?? false,

      tableStriped: u.settings?.tableStriped ?? true,
      tableShowAvatars: u.settings?.tableShowAvatars ?? true,
      showAdvancedPanels: u.settings?.showAdvancedPanels ?? false,
    });

    this.avatarPreviewUrl = u.avatarUrl ?? null;
    this.avatarFile = null;
    this.avatarRemoved = false;
  }

  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

   onAvatarPicked(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    if (!input?.files?.length) {
      this.toast.warn('No file selected');
      return;
    }
    const file = input.files[0];
    this.avatarFile = file;
    this.avatarRemoved = false;

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreviewUrl = typeof reader.result === 'string' ? reader.result : null;
      this.toast.success('Avatar updated (demo)');
    };
    reader.readAsDataURL(file);

    // (optional) If you didn’t add fileInput.value='' inline in the template:
    // input.value = '';
  }


  clearAvatar(): void {
    this.avatarFile = null;
    this.avatarPreviewUrl = null;
    this.avatarRemoved = true;
  }

  private async goToDashboardFallback(): Promise<void> {
    const targets = ['/portal/dashboard', '/portal', '/'];
    for (const url of targets) {
      try {
        const ok = await this.router.navigateByUrl(url);
        if (ok) return;
      } catch {}
    }
  }

  async onSave(): Promise<void> {
    console.log('[UserSettings] onSave clicked');

    const u = this.user;
    if (!u) {
      this.toast.error('No user loaded');
      return;
    }
    if (this.form.invalid) {
      this.toast.warn('Please fix validation before saving');
      return;
    }

    const v = this.form.value;
    this.save.emit({
      id: u.id,
      name: v.name,
      email: v.email,
      phone: v.phone ?? null,
      password: v.password || null,
      avatarFile: this.avatarFile,
      avatarRemoved: this.avatarRemoved,
      settings: {
        theme: v.theme,
        density: v.density,
        defaultLanding: v.defaultLanding,
        defaultLocationId: v.defaultLocationId,
        timeZone: v.timeZone,
        timeFormat: v.timeFormat,
        dateFormat: v.dateFormat,
        notifyByEmail: !!v.notifyByEmail,
        notifyBySms: !!v.notifyBySms,
        tableStriped: !!v.tableStriped,
        tableShowAvatars: !!v.tableShowAvatars,
        showAdvancedPanels: !!v.showAdvancedPanels,
      },
    });

    this.toast.success('Settings saved');
    await this.goToDashboardFallback();
  }

  async onCancelClick(): Promise<void> {
    console.log('[UserSettings] Cancel clicked');
    this.cancel.emit();
    this.toast.info('Changes discarded');
    await this.goToDashboardFallback();
  }
}
