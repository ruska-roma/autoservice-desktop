import { isDefined } from '@/shared/lib';

import type { AutoType } from '../types';

export const getAutoVin = (car: AutoType): string => {
  const vin = car.vin?.trim();

  if (!isDefined(vin) || vin === 'н/д') {
    return 'VIN номер отсутствует';
  }

  return vin.toUpperCase();
};
