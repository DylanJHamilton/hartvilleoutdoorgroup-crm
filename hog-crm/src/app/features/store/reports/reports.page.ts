import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'hog-store-reports',
  imports: [
    CommonModule, ReactiveFormsModule, MatTabsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule
  ],
  template: `... (unchanged template) ...`,
  styles: [`.row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0} mat-form-field{min-width:200px}`]
})
export class ReportsPage {
  private fb = inject(FormBuilder);

  pipes = ['Sheds','Barns','Cabins','Furniture','Swing Sets','Trampolines','Playgrounds','Golf Carts','E-Bikes'];
  cats  = this.pipes;

  sales = this.fb.group({ from:[new Date()], to:[new Date()], pipeline:[''] });
  inv   = this.fb.group({ asOf:[new Date()], category:[''] });
  ops   = this.fb.group({ from:[new Date()], to:[new Date()], area:['service'] });

  export(kind:'sales'|'inventory'|'ops'){ /* call backend export later */ }
}
