// src/app/features/location/sales/quote/promotions/dialog/promotion-details.dialog.ts
import { Component, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Promotion } from '../promotions.service';

@Component({
  standalone: true,
  selector: 'hog-promotion-details-dialog',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatChipsModule],
  templateUrl: './promotion-details.dialog.html',
  styleUrls: ['./promotion-details.dialog.scss']
})
export class PromotionDetailsDialog {
  data = inject<Promotion>(MAT_DIALOG_DATA);
}
