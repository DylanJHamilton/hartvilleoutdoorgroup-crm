// Mock seed generator for Promotions
export const PROMO_CATEGORIES = [
  'Grills',
  'Patio',
  'Outdoor Kitchens',
  'Smokers',
  'Accessories',
  'Fire Pits'
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomItems<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const res: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    res.push(copy.splice(idx, 1)[0]);
  }
  return res;
}
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomId(prefix: string, i: number) {
  return `${prefix}_${i}`;
}
function randomSku() {
  return 'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}
function randomWords() {
  const words = ['Summer', 'Deal', 'Hot', 'Exclusive', 'Special', 'Bundle', 'Savings', 'Flash', 'Outdoor', 'Fire'];
  return randomItem(words) + ' ' + randomItem(words);
}

export function seedPromotions(count = 20): any[] {
  const promos: any[] = [];
  for (let i = 0; i < count; i++) {
    const startOffset = randomInt(-30, 30);
    const duration = randomInt(7, 45);

    const start = new Date();
    start.setDate(start.getDate() + startOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + duration);

    const percent = Math.random() > 0.5;
    promos.push({
      id: randomId('promo', i + 1),
      name: randomWords(),
      code: 'P' + randomInt(10000, 99999),
      discountType: percent ? 'Percent' : 'Amount',
      discountValue: percent ? randomInt(5, 25) : randomInt(50, 500),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      categories: randomItems(PROMO_CATEGORIES, randomInt(1, 3)),
      eligibleSkus: Array.from({ length: randomInt(2, 6) }, () => randomSku()),
      stackable: Math.random() > 0.5,
      approvalRequired: Math.random() > 0.5,
      notes: 'Sample note about this promotion.'
    });
  }
  return promos;
}
