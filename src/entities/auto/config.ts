import type { AutoFormFieldType } from './types';

export const AUTO_TABLE_NAME = 't_auto' as const;

export const AUTO_TABLE_COLUMNS = [
  { key: 'id_auto', label: 'ID' },
  { key: 'vin', label: 'VIN' },
  { key: 'plate_number', label: 'Госномер' },
  { key: 'client_name', label: 'Клиент' },
  { key: 'brand', label: 'Марка' },
  { key: 'model', label: 'Модель' },
] as const;

export const AUTO_SEARCH_FIELDS = [
  { key: 'id_auto', label: 'ID' },
  { key: 'vin', label: 'VIN' },
  { key: 'plate_number', label: 'Госномер' },
] as const;

export const AUTO_FORM_SCHEMA: AutoFormFieldType[] = [
  {
    key: 'vin',
    label: 'VIN',
    type: 'text',
    required: true,
    maxLength: 30,
    minLength: 17,
    fullWidth: true,
    mask: 'alnum',
    transform: (value: string) => value.toUpperCase(),
  },
  {
    key: 'plate_number',
    label: 'Госномер',
    type: 'text',
    required: true,
    maxLength: 20,
    fullWidth: true,
    mask: 'plate',
    transform: (value: string) => value.toUpperCase(),
  },
  { key: 'brand', label: 'Марка', type: 'text', maxLength: 50 },
  { key: 'model', label: 'Модель', type: 'text', maxLength: 50 },
];
