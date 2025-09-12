import type { WorkType } from '../types';

export const getWorkDescription = (work: WorkType): string => {
  const description = work.description?.trim();
  return description || 'Без названия';
};
