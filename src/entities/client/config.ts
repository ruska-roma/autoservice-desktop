import type { ClientFormFieldType } from './types';

export const CLIENT_TABLE_NAME = 't_client' as const;

export const CLIENT_TABLE_COLUMNS = [
  { key: 'id_client', label: 'ID' },
  { key: 'name', label: 'ФИО' },
  { key: 'phone', label: 'Телефон' },
  { key: 'address', label: 'Адрес' },
  { key: 'info', label: 'Инфо' },
] as const;

export const CLIENT_SEARCH_FIELDS = [
  { key: 'id_client', label: 'ID' },
  { key: 'name', label: 'ФИО' },
  { key: 'phone', label: 'Телефон' },
] as const;

export const CLIENT_FORM_SCHEMA: ClientFormFieldType[] = [
  { key: 'name', label: 'ФИО', type: 'text', required: true, maxLength: 200, fullWidth: true },
  {
    key: 'phone',
    label: 'Телефон',
    mask: 'phone',
    type: 'text',
    maxLength: 50,
    required: true,
  },
  { key: 'address', label: 'Адрес', type: 'text', maxLength: 200 },
  { key: 'info', label: 'Комментарий', type: 'text', maxLength: 200, fullWidth: true },
];
