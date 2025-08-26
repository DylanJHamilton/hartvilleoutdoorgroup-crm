import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snack = inject(MatSnackBar);

  success(msg: string, action = 'OK', ms = 2000) { this.snack.open(msg, action, { duration: ms, panelClass: ['snack-success'] }); }
  info(msg: string, action = 'OK', ms = 2000)    { this.snack.open(msg, action, { duration: ms, panelClass: ['snack-info'] }); }
  warn(msg: string, action = 'OK', ms = 2000)    { this.snack.open(msg, action, { duration: ms, panelClass: ['snack-warn'] }); }
  error(msg: string, action = 'DISMISS', ms = 3500) { this.snack.open(msg, action, { duration: ms, panelClass: ['snack-error'] }); }
}
