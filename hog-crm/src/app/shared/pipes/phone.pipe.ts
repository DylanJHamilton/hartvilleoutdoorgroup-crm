import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'phone', standalone: true, pure: true })
export class PhonePipe implements PipeTransform {
  transform(input: string | null | undefined): string {
    if (!input) return '';
    const digits = ('' + input).replace(/\D+/g, '');
    // support leading country code 1
    const d = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
    if (d.length === 7) return `${d.slice(0,3)}-${d.slice(3)}`;
    return input; // fallback unformatted
  }
}
