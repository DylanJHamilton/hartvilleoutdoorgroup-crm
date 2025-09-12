import { ActivityItem, ActivityStatus, ActivityType } from '../types/sales/appointments/appointments.types';

function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const customers = ['Smith Family','ACME Corp','Baker Homes','Lakeside HOA','Green Acres LLC','Miller Group'];
const subjects = ['Follow-up call','Showroom visit','On-site consult','Estimate review','Spec confirmation','Design review'];
const owners = [
  { id: 'u1', name: 'Alex Admin' },
  { id: 'u2', name: 'Sally Sales' },
  { id: 'u3', name: 'Mark Manager' },
];
const types: ActivityType[] = ['Call','Meeting','Task'];
const statuses: ActivityStatus[] = ['Planned','Completed','Canceled'];

export function seedAppointments(count = 24, seed = 42): ActivityItem[] {
  const rnd = mulberry32(seed);
  const now = new Date();
  const items: ActivityItem[] = [];
  for (let i = 0; i < count; i++) {
    const c = customers[Math.floor(rnd()*customers.length)];
    const s = subjects[Math.floor(rnd()*subjects.length)];
    const o = owners[Math.floor(rnd()*owners.length)];
    const t = types[Math.floor(rnd()*types.length)];
    const st = statuses[Math.floor(rnd()*statuses.length)];
    const daysOffset = Math.floor(rnd()*30) - 15; // +/- ~2 weeks
    const dt = new Date(now.getTime() + daysOffset*86400000 + Math.floor(rnd()*8)*3600000);
    const isAppt = t === 'Meeting';
    items.push({
      id: `appt_${i+1}`,
      customer: c,
      subject: s,
      type: t,
      ownerId: o.id,
      ownerName: o.name,
      datetime: dt.toISOString(),
      status: st,
      notes: '',
      isAppointment: isAppt
    });
  }
  return items;
}

export const seedOwners = owners;
