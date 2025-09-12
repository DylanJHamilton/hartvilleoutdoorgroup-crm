import { Injectable, signal } from '@angular/core';

type Role = 'admin' | 'manager' | 'rep';

@Injectable({ providedIn: 'root' })
export class AccessService {
  // Replace with real auth/route context later
  private _role = signal<Role>('manager');
  private _userId = signal('rep-001');
  private _storeId = signal('mentor');

  setContext(role: Role, userId: string, storeId: string) {
    this._role.set(role); this._userId.set(userId); this._storeId.set(storeId);
  }

  isManagerLike() { return this._role() === 'admin' || this._role() === 'manager'; }
  isRep() { return this._role() === 'rep'; }
  currentUserId() { return this._userId(); }
  currentStoreId() { return this._storeId(); }
}
