import { Component, EventEmitter, Input, Output, SimpleChanges, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }      from '@angular/material/input';
import { MatButtonModule }     from '@angular/material/button';
import { MatIconModule }       from '@angular/material/icon';
import { MatSelectModule }     from '@angular/material/select';
import { MatCheckboxModule }   from '@angular/material/checkbox';
import { MatChipsModule }      from '@angular/material/chips';
import { MatDividerModule }    from '@angular/material/divider';
import { MatTooltipModule }    from '@angular/material/tooltip';
import { Router, RouterLink }  from '@angular/router';

import type { User } from '../../../../types/user.types';
import type { UserSettings, Theme, Density, LandingPage } from '../../../../types/userSettings.types';

interface LocationRef { id: string; name: string; }

@Component({
  standalone: true,
  selector: 'hog-user-settings',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatCheckboxModule, MatChipsModule, MatDividerModule, MatTooltipModule
  ],
  templateUrl: './user-settings.html',
  styleUrls: ['./user-settings.scss']
})
export class UserSettingsComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  /* Inputs */
  @Input() user!: User;                    // current user being edited
  @Input() currentUser!: User;             // acting user
  @Input() locations: LocationRef[] = [];  // for defaultLocation select
  @Input() context: 'portal' | 'location' = 'portal';
  @Input() portalSettingsRoute: any[] | string = ['/portal/settings'];

  /* Outputs */
  @Output() save = new EventEmitter<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    password?: string;
    avatarFile?: File | null;
    avatarRemoved?: boolean;
    settings: UserSettings;
  }>();
  @Output() cancel = new EventEmitter<void>();

  /* Avatar preview */
  avatarFile: File | null = null;
  avatarPreviewUrl: string | null = null;

  /* ---- FORM: ensure these names EXACTLY match template ---- */
  form: FormGroup<{
    name: FormControl<string>;
    password: FormControl<string>;
    email: FormControl<string>;
    phone: FormControl<string | null>;
    theme: FormControl<Theme>;
    density: FormControl<Density>;
    defaultLocationId: FormControl<string | null>;
    defaultLanding: FormControl<LandingPage>;
    timeZone: FormControl<string | null>;
    timeFormat: FormControl<'h:mma' | 'HH:mm'>;
    dateFormat: FormControl<'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd'>;
    notifyByEmail: FormControl<boolean>;
    notifyBySms: FormControl<boolean>;
    tableStriped: FormControl<boolean>;
    tableShowAvatars: FormControl<boolean>;
    showAdvancedPanels: FormControl<boolean>;
  }> = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    password: this.fb.nonNullable.control(''),
    email: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.email] }),
    phone: this.fb.control<string | null>(null),
    theme: this.fb.nonNullable.control<Theme>('system'),
    density: this.fb.nonNullable.control<Density>('comfortable'),
    defaultLocationId: this.fb.control<string | null>(null),
    defaultLanding: this.fb.nonNullable.control<LandingPage>('portal-dashboard'),
    timeZone: this.fb.control<string | null>(null),
    timeFormat: this.fb.nonNullable.control<'h:mma' | 'HH:mm'>('h:mma'),
    dateFormat: this.fb.nonNullable.control<'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd'>('MM/dd/yyyy'),
    notifyByEmail: this.fb.nonNullable.control<boolean>(true),
    notifyBySms: this.fb.nonNullable.control<boolean>(false),
    tableStriped: this.fb.nonNullable.control<boolean>(true),
    tableShowAvatars: this.fb.nonNullable.control<boolean>(true),
    showAdvancedPanels: this.fb.nonNullable.control<boolean>(false),
  });

  /* Derived options */
  get allowedDefaultLocationOptions(): LocationRef[] {
    const userIds = new Set<string>((this.user?.locationIds ?? []).map(String));
    return this.locations.filter(l => userIds.has(String(l.id)));
  }

  /* Sync form with inputs */
  ngOnChanges(_: SimpleChanges): void {
    if (!this.user) return;

    const s = this.withDefaultSettings(this.user.settings);

    this.form.patchValue({
      name: this.user.name ?? '',
      password: '',
      email: this.user.email ?? '',
      phone: (this as any).user?.phone ?? null,
      theme: s.theme,
      density: s.density,
      defaultLocationId: s.defaultLocationId,
      defaultLanding: s.defaultLanding,
      timeZone: s.timeZone ?? null,
      timeFormat: s.timeFormat ?? 'h:mma',
      dateFormat: s.dateFormat ?? 'MM/dd/yyyy',
      notifyByEmail: s.notifyByEmail,
      notifyBySms: s.notifyBySms,
      tableStriped: s.tableStriped,
      tableShowAvatars: s.tableShowAvatars,
      showAdvancedPanels: s.showAdvancedPanels,
    }, { emitEvent: false });

    this.avatarFile = null;
    this.avatarPreviewUrl = null;

    // if defaultLocationId is set but user no longer has it, clear it
    const options = new Set(this.allowedDefaultLocationOptions.map(o => String(o.id)));
    const currentDefault = this.form.get('defaultLocationId')!.value;
    if (currentDefault && !options.has(String(currentDefault))) {
      this.form.get('defaultLocationId')!.setValue(null);
    }
  }

  /* Avatar (demo) */
  onAvatarPicked(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files && input.files[0];
    this.avatarFile = file ?? null;
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.avatarPreviewUrl = String(reader.result || '');
      reader.readAsDataURL(file);
    } else {
      this.avatarPreviewUrl = null;
    }
  }
  clearAvatar() { this.avatarFile = null; this.avatarPreviewUrl = null; }

  /* Utils */
  private withDefaultSettings(s?: UserSettings | null): UserSettings {
    return {
      theme: s?.theme ?? 'system',
      density: s?.density ?? 'comfortable',
      defaultLocationId: s?.defaultLocationId ?? null,
      defaultLanding: s?.defaultLanding ?? 'portal-dashboard',
      timeZone: s?.timeZone ?? null,
      timeFormat: s?.timeFormat ?? 'h:mma',
      dateFormat: s?.dateFormat ?? 'MM/dd/yyyy',
      notifyByEmail: s?.notifyByEmail ?? true,
      notifyBySms: s?.notifyBySms ?? false,
      tableStriped: s?.tableStriped ?? true,
      tableShowAvatars: s?.tableShowAvatars ?? true,
      showAdvancedPanels: s?.showAdvancedPanels ?? false,
    };
  }

  locationNameById(id: string): string {
    return this.locations.find(l => String(l.id) === String(id))?.name ?? id;
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* Save */
  onSave() {
    if (!this.user || this.form.invalid) return;

    let defaultLocationId = this.form.get('defaultLocationId')!.value;
    const userIds = new Set<string>((this.user?.locationIds ?? []).map(String));
    if (defaultLocationId && !userIds.has(String(defaultLocationId))) {
      defaultLocationId = null;
    }

    const settings: UserSettings = {
      theme: this.form.get('theme')!.value!,
      density: this.form.get('density')!.value!,
      defaultLocationId,
      defaultLanding: this.form.get('defaultLanding')!.value!,
      timeZone: this.form.get('timeZone')!.value ?? null,
      timeFormat: this.form.get('timeFormat')!.value!,
      dateFormat: this.form.get('dateFormat')!.value!,
      notifyByEmail: !!this.form.get('notifyByEmail')!.value,
      notifyBySms: !!this.form.get('notifyBySms')!.value,
      tableStriped: !!this.form.get('tableStriped')!.value,
      tableShowAvatars: !!this.form.get('tableShowAvatars')!.value,
      showAdvancedPanels: !!this.form.get('showAdvancedPanels')!.value,
    };

    this.save.emit({
      id: this.user.id,
      name: this.form.get('name')!.value,
      email: this.form.get('email')!.value,
      phone: this.form.get('phone')!.value ?? undefined,
      password: this.form.get('password')!.value || undefined,
      avatarFile: this.avatarFile ?? undefined,
      avatarRemoved: !this.avatarFile && this.avatarPreviewUrl === null ? true : undefined,
      settings
    });
  }
}
