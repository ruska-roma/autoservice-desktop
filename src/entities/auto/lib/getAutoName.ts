import type { AutoType } from '../types';

export const getAutoName = (car: AutoType): string => {
  const production = car.brand?.trim();
  const model = car.model?.trim();

  if (production && model) {
    return `${production} ${model}`;
  }

  return production || model || 'Без названия';
};
