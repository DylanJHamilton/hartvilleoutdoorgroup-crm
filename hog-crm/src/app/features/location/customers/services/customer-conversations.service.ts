import { Injectable, signal, inject } from '@angular/core';
import { CustomersService } from './customer.service';

export type Channel = 'note'|'call'|'sms'|'email';
export type Direction = 'in'|'out';

export interface ConversationMessage {
  id: string;
  customerId: string;
  channel: Channel;
  direction: Direction;      // 'in' for customer → us, 'out' for us → customer
  text: string;
  atISO: string;             // ISO timestamp
  byUserId?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerConversationsService {
  private customers = inject(CustomersService);
  // customerId -> messages[]
  private _map = signal<Record<string, ConversationMessage[]>>({});

  messages(customerId: string): ConversationMessage[] {
    const arr = this._map()[customerId] ?? [];
    return [...arr].sort((a,b) => +new Date(a.atISO) - +new Date(b.atISO));
  }

  addMessage(customerId: string, msg: Omit<ConversationMessage, 'id'|'customerId'|'atISO'>) {
    const id = 'm' + Math.random().toString(36).slice(2,9);
    const full: ConversationMessage = {
      id, customerId,
      atISO: new Date().toISOString(),
      ...msg
    };
    const cur = this._map()[customerId] ?? [];
    this._map.update(m => ({ ...m, [customerId]: [...cur, full] }));

    // Update the Customer.notes snippet so the list shows the latest message
    const snippet = this.buildSnippet(full);
    this.customers.update(customerId, { notes: snippet });
    return full;
  }

  private buildSnippet(m: ConversationMessage): string {
    const prefix = ({ note:'Note', call:'Call', sms:'SMS', email:'Email' } as const)[m.channel];
    const who = m.direction === 'in' ? 'From customer' : 'To customer';
    const text = (m.text || '').replace(/\s+/g,' ').trim();
    return `${prefix} • ${who}: ${text}`.slice(0, 160);
  }
}
