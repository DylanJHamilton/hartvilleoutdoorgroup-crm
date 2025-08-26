import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'hog-store-settings',
  imports: [
    CommonModule, ReactiveFormsModule, MatTabsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatButtonModule
  ],
  template: `... (unchanged template) ...`,
  styles: [`.row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0} .col{display:flex;flex-direction:column;gap:12px;margin:12px 0} .full{width:100%} mat-form-field{min-width:200px}`]
})
export class SettingsPage {
  private fb = inject(FormBuilder);

  general = this.fb.group({ name:['Hartville — Main', Validators.required], tz:['America/New_York'], openWeekends:[true] });
  pipelines = this.fb.group({ stages:['Intake, Qualified, Quoted, Won, Delivered'] });
  tax = this.fb.group({ rate:[6.5], discount:[0] });
  integrations = this.fb.group({ mapsKey:[''], payments:[''] });

  save(which:string){ /* send to backend later */ }
}
