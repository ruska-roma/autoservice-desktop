import { isDefined } from '@/shared/lib';

import type { AccountType } from '../types';

const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

export const getFormattedAccountData = (data: AccountType, prefix?: string) => {
  const { date } = data;

  if (!isDefined(date)) {
    return;
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }

  const day = d.getDate();
  const month = MONTHS_RU[d.getMonth()];
  const year = d.getFullYear();

  return prefix ? `${prefix} ${day} ${month} ${year}` : `${day} ${month} ${year}`;
};
