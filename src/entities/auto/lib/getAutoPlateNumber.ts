import { isDefined } from '@/shared/lib';

import type { AutoType } from '../types';

export const getAutoPlateNumber = (car: AutoType): string => {
  const number = car.plate_number?.trim();

  if (!isDefined(number) || number == 'н/д') {
    return 'Госномер отсутствует';
  }

  return number.toUpperCase();
};
