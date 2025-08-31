import { ResolveFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { mockStores, type LocationRef } from '../../mock/locations.mock';

export const locationResolver: ResolveFn<LocationRef | null> = (route) => {
  const router = inject(Router);
  const id = route.parent?.paramMap.get('locationId') ?? route.paramMap.get('locationId');
  const loc = mockStores.find(l => l.id === id) ?? null;
  if (!loc) router.navigateByUrl('/portal');
  return loc;
};
