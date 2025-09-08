export type StoreProfile = {
  id: string;
  size: 'S'|'M'|'L';
  demandIndex: number;      // 0.6..1.6
  seasonality: number[];    // 12 multipliers ~0.8..1.5
  mix: { carts:number; sheds:number; play:number; cabins:number; parts:number };
  deliveryCapacity: number; // 0.6..1.5
  serviceComplexity: number;// 0.7..1.4
};

export const storeProfiles: StoreProfile[] = [
  { id:'s1', size:'L', demandIndex:1.35,
    seasonality:[1.0,0.95,1.05,1.1,1.2,1.3,1.35,1.4,1.25,1.1,1.0,0.9],
    mix:{ carts:0.42, sheds:0.28, play:0.12, cabins:0.08, parts:0.10 },
    deliveryCapacity:1.3, serviceComplexity:1.0
  },
  { id:'s2', size:'M', demandIndex:1.00,
    seasonality:[0.9,0.92,0.98,1.05,1.15,1.25,1.3,1.28,1.15,1.05,0.96,0.9],
    mix:{ carts:0.35, sheds:0.30, play:0.14, cabins:0.06, parts:0.15 },
    deliveryCapacity:1.1, serviceComplexity:1.1
  },
  { id:'s3', size:'M', demandIndex:0.95,
    seasonality:[0.88,0.9,0.97,1.03,1.08,1.2,1.25,1.22,1.1,1.0,0.95,0.9],
    mix:{ carts:0.60, sheds:0.10, play:0.06, cabins:0.04, parts:0.20 },
    deliveryCapacity:0.9, serviceComplexity:0.9
  },
];

export const profileFor = (id:string): StoreProfile =>
  storeProfiles.find(p => p.id === id) ?? {
    id, size:'M', demandIndex:1,
    seasonality:Array(12).fill(1),
    mix:{carts:0.35,sheds:0.3,play:0.14,cabins:0.06,parts:0.15},
    deliveryCapacity:1, serviceComplexity:1
  };
