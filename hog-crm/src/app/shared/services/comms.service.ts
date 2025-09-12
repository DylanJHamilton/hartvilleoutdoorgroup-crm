import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CommsService {
  call(phone?: string){
    if (!phone) return;
    window.open(`tel:${encodeURIComponent(phone)}`, '_self');
  }

  sms(phone?: string, body?: string){
    if (!phone) return;
    const uri = `sms:${encodeURIComponent(phone)}${body ? `?&body=${encodeURIComponent(body)}` : ''}`;
    window.open(uri, '_self');
  }

  email(to?: string, subject?: string, body?: string){
    if (!to) return;
    const uri = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject ?? '')}&body=${encodeURIComponent(body ?? '')}`;
    window.open(uri, '_self');
  }
}
