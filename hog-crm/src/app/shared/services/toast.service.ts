import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

type ToastKind = 'success' | 'info' | 'warn' | 'error';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snack = inject(MatSnackBar);

  private open(message: string, kind: ToastKind, config?: MatSnackBarConfig) {
    const base: MatSnackBarConfig = {
      duration: 2500,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: [`snack-${kind}`],
    };
    return this.snack.open(message, 'Close', { ...base, ...config });
  }

  success(message: string, config?: MatSnackBarConfig) { return this.open(message, 'success', config); }
  info(message: string, config?: MatSnackBarConfig)    { return this.open(message, 'info', config); }
  warn(message: string, config?: MatSnackBarConfig)    { return this.open(message, 'warn', config); }
  error(message: string, config?: MatSnackBarConfig)   { return this.open(message, 'error', config); }

  /** Optional helper for server errors */
  httpError(err: unknown, fallback = 'Something went wrong') {
    const msg =
      (typeof err === 'object' && err && 'message' in err && typeof (err as any).message === 'string')
        ? (err as any).message
        : fallback;
    return this.error(msg, { duration: 4000 });
  }
}
