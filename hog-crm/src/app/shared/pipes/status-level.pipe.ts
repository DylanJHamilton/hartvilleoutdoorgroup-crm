import { Pipe, PipeTransform } from '@angular/core';

/** Maps domain statuses to a simple level string for styling (success|warn|error|info). */
@Pipe({ name: 'statusLevel', standalone: true, pure: true })
export class StatusLevelPipe implements PipeTransform {
  private map: Record<string, 'success'|'warn'|'error'|'info'> = {
    'Won': 'success',
    'Delivered': 'success',
    'Active': 'success',
    'In Stock': 'success',

    'Open': 'info',
    'Intake': 'info',
    'Qualified': 'info',
    'Quoted': 'info',
    'Booked': 'info',
    'Planned': 'info',
    'Pending': 'info',

    'Reserved': 'warn',
    'En Route': 'warn',
    'High': 'warn',
    'Critical': 'error',

    'Lost': 'error',
    'Failed': 'error',
    'Out of Stock': 'error',
    'Cancelled': 'error',
    'Closed': 'info',
    'Resolved': 'success',
  };

  transform(status: string | null | undefined): 'success'|'warn'|'error'|'info' {
    if (!status) return 'info';
    return this.map[status] ?? 'info';
  }
}
