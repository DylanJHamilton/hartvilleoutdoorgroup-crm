// features/store/sales/data/deals.actions.ts
import { createActionGroup, props } from '@ngrx/store';
import { Deal } from '../../../types/deal.types';
export const DealsActions = createActionGroup({
  source: 'Deals',
  events: {
    'Load': props<{ storeId: string }>(),
    'Load Success': props<{ items: Deal[] }>(),
    'Load Failure': props<{ error: unknown }>(),
    'Update Stage': props<{ id: string; stage: string }>(),
    'Update Stage Success': props<{ id: string; stage: string }>(),
  }
});
