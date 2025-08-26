export type Pipeline = 'Sheds'|'Barns'|'Cabins'|'Furniture'|'SwingSets'|'Trampolines'|'Playgrounds'|'GolfCarts'|'EBikes';
export interface Deal {
  id: string;
  title: string;
  customerId: string;
  pipeline: Pipeline;
  stage: string;           // e.g. 'Intake', 'Quoted', 'Won', 'Delivered'
  value: number;
  ownerId: string;         // Sales associate
  storeId: string;
  createdAt: string;       // ISO
  updatedAt: string;
}
