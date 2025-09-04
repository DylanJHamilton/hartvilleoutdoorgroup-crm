// src/app/features/portal/inventory/inventory.types.ts

export type StoreId = '1' | '2' | '3';

export type Category =
  | 'Golf Carts'
  | 'Sheds & Garages'
  | 'Playsets'
  | 'Cabins'
  | 'Parts'
  | 'Basketball Hoops'
  | 'Playgrounds'
  | 'Trampolines';

export interface InventoryItem {
  id: string;
  storeId: StoreId;
  sku: string;
  name: string;
  category: Category;
  subcategory?: string;
  brand?: string;
  price: number;
  qty: number;
  lowAt: number;
  status: 'OK' | 'LOW';
  updatedAt: string;
  active: boolean;
}


export const STORE_SLUGS: Record<StoreId, string> = {
  '1': 's1',
  '2': 's2',
  '3': 's3',
};

export const STORE_NAMES: Record<StoreId, string> = {
  '1': 'Hartville HQ',
  '2': 'Medina',
  '3': 'Mentor',
};

export const BRAND_SITES: Record<string, string> = {
  'Hartville Outdoor Products': 'https://hartvilleoutdoorproducts.com',
  'Hartville Golf Carts': 'https://hartvillegolfcarts.com',
  'Kids World Play Systems': 'https://kidsworldplay.com',
  'Ohio Cabins & Structures': 'https://ohiocabinsandstructures.com',
};
