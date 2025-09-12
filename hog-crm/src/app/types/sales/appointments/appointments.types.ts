export type ActivityType = 'Call' | 'Meeting' | 'Task';
export type ActivityStatus = 'Planned' | 'Completed' | 'Canceled';

export interface ActivityItem {
  id: string;
  customer: string;
  subject: string;
  type: ActivityType;
  ownerId: string;
  ownerName: string;
  datetime: string;       // ISO
  status: ActivityStatus;
  notes?: string;
  isAppointment: boolean; // Meeting => true
}

export interface OwnerRef { id: string; name: string; }
