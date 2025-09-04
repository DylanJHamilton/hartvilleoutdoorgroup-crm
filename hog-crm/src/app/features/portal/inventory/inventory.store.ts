import { Injectable, computed, signal } from '@angular/core';
import type { InventoryItem, StoreId, Category } from '../../../types/inventory.types';

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function cuidLike(n: number) {
  return 'ci_' + Math.abs(n).toString(36) + Math.random().toString(36).slice(2, 8);
}

const CATS: Category[] = [
  'Golf Carts',
  'Sheds & Garages',
  'Playsets',
  'Cabins',
  'Parts',
  'Basketball Hoops',
  'Playgrounds',
  'Trampolines',
];

@Injectable({ providedIn: 'root' })
export class InventorySignalStore {
  readonly items = signal<InventoryItem[]>([]);
  readonly selected = signal<Set<string>>(new Set());

  readonly totalCount = computed(() => this.items().length);
  readonly lowCount = computed(() => this.items().filter(i => i.status === 'LOW').length);

  constructor() {
    this.items.set(this.seedDeterministic(1337, 220));
  }

  setSelected(ids: string[], value: boolean) {
    this.selected.update(sel => {
      ids.forEach(id => (value ? sel.add(id) : sel.delete(id)));
      return new Set(sel);
    });
  }

  private withComputed(it: Omit<InventoryItem, 'status'> & { status?: InventoryItem['status'] }): InventoryItem {
    const status: InventoryItem['status'] = (it.qty ?? 0) <= (it.lowAt ?? 0) ? 'LOW' : 'OK';
    return { ...it, status };
  }

  private randPrice(cat: Category): number {
    const ranges: Record<Category, [number, number]> = {
      'Golf Carts': [7500, 13500],
      'Sheds & Garages': [3500, 6500],
      'Playsets': [1200, 3500],
      'Cabins': [9000, 20000],
      'Parts': [25, 600],
      'Basketball Hoops': [300, 2500],
      'Playgrounds': [5000, 20000],
      'Trampolines': [400, 2500],
    };
    const [lo, hi] = ranges[cat];
    return Math.round(lo + Math.random() * (hi - lo));
  }

  seedDeterministic(seed: number, count = 200): InventoryItem[] {
    const rnd = mulberry32(seed);
    const items: InventoryItem[] = [];
    const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
    const storeIds: StoreId[] = ['1', '2', '3'];

    for (let i = 0; i < count; i++) {
      const storeId = storeIds[Math.floor(rnd() * storeIds.length)];
      let category: Category;

      if (storeId === '3') {
        category = rnd() < 0.75 ? 'Golf Carts' : 'Parts';
      } else {
        category = pick(CATS);
      }

      const brand =
        category === 'Golf Carts'
          ? 'Hartville Golf Carts'
          : category === 'Cabins'
          ? 'Ohio Cabins & Structures'
          : category === 'Playsets' || category === 'Basketball Hoops' || category === 'Trampolines' || category === 'Playgrounds'
          ? 'Kids World Play Systems'
          : 'Hartville Outdoor Products';

      const name =
        category === 'Golf Carts'
          ? `${pick(['Evolution', 'Denago', 'Dash'])} ${pick(['Forester', 'Rover', 'D5', 'Elite'])}`
          : category === 'Sheds & Garages'
          ? `${pick(['Barn', 'Gable', 'Garage'])} ${pick(['10x12', '12x16', '12x20'])}`
          : category === 'Cabins'
          ? `${pick(['Cottage', 'Lofted Cabin'])} ${pick(['12x24', '14x28'])}`
          : category === 'Playsets'
          ? pick(['Poly A3', 'Timber C1'])
          : category === 'Basketball Hoops'
          ? pick(['Adjustable Hoop', 'Portable Hoop'])
          : category === 'Playgrounds'
          ? pick(['Playground A', 'Playground B'])
          : category === 'Trampolines'
          ? pick(['12ft Round', '16ft Pro'])
          : pick(['Battery', 'Tire', 'Seat Kit']);

      const price = this.randPrice(category);
      const qty = Math.max(0, Math.round(rnd() * 10));
      const lowAt = Math.max(1, Math.round(qty * 0.3));

      items.push(
        this.withComputed({
          id: cuidLike(i + 1),
          storeId,
          sku: `${brand.split(' ')[0].toUpperCase()}-${Math.floor(1000 + rnd() * 9000)}`,
          name,
          category,
          subcategory: undefined,
          brand,
          price,
          qty,
          lowAt,
          updatedAt: new Date(Date.now() - Math.floor(rnd() * 7) * 86400000).toISOString(),
          active: rnd() > 0.1,
        })
      );
    }

    return items;
  }
}
