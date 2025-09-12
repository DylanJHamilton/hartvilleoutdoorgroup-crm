import { Injectable, signal } from '@angular/core';
import { ActivityItem } from '../../../../types/sales/appointments/appointments.types';
import { seedAppointments, seedOwners } from '../../../../mock/appointments.mock';

@Injectable({ providedIn: 'root' })
export class ActivitiesService {
  private _seq = signal(1000);
  owners = seedOwners;

  getSeeded(count = 24) : ActivityItem[] {
    return seedAppointments(count, 73);
  }

  nextId() {
    const n = this._seq.update(v => v + 1);
    return `appt_${n}`;
  }
}
