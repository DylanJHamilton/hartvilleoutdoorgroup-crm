// Deterministic RNG
function seeded(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type DateRange = { start: Date; end: Date };

export function seedDailySales(storeId: string, ownerId: string | undefined, range: DateRange | null) {
  const key = ['dailySales', storeId, ownerId ?? 'ALL', range?.start?.toISOString() ?? '', range?.end?.toISOString() ?? ''].join('|');
  const rnd = seeded(key);
  const N = 30;
  const days = Array.from({ length: N }, (_, i) => {
    const amt = 1200 + Math.floor(rnd() * 7000);
    const deals = 3 + Math.floor(rnd() * 9);
    return { d: i + 1, revenue: amt, deals };
  });
  return days;
}

export function seedPipelineSnapshots(storeId: string, ownerId: string | undefined, buckets = ['Lead','Qualified','Quoted','Verbal Yes','Won','Lost']) {
  const key = ['pipe', storeId, ownerId ?? 'ALL', buckets.join('-')].join('|');
  const rnd = seeded(key);
  return buckets.map(stage => ({ stage, value: 5000 + Math.floor(rnd()*25000) }));
}

export function seedProductSales(storeId: string, range: DateRange | null) {
  const key = ['prod', storeId, range?.start?.toISOString() ?? '', range?.end?.toISOString() ?? ''].join('|');
  const rnd = seeded(key);
  const cats = ['Sheds','Garages','Playsets','Cabins','Carts'];
  const skus = Array.from({ length: 12 }, (_, i) => ({
    sku: `SKU-${1000 + i}`,
    name: `Top Seller ${i+1}`,
    category: cats[Math.floor(rnd()*cats.length)],
    units: 5 + Math.floor(rnd()*28),
    price: 900 + Math.floor(rnd()*5900),
  }));
  // rank by units (stable)
  skus.sort((a,b) => b.units - a.units);
  // category totals
  const catAgg = cats.map(c => ({
    category: c,
    units: skus.filter(s => s.category === c).reduce((sum, s) => sum + s.units, 0),
    revenue: skus.filter(s => s.category === c).reduce((sum, s) => sum + s.units * s.price, 0),
  }));
  return { skus, categories: catAgg };
}
