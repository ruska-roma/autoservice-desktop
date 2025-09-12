import type { AccountFormFieldType } from './types';

export const ACCOUNT_TABLE_NAME = 't_account' as const;

export const ACCOUNT_TABLE_COLUMNS = [
  { key: 'id_account', label: 'ID' },
  { key: 'legal_number', label: 'Номер счета' },
  { key: 'date', label: 'Дата создания' },
  { key: 'auto_vin', label: 'VIN номер авто' },
  { key: 'info', label: 'Инфо' },
] as const;

export const ACCOUNT_SEARCH_FIELDS = [
  { key: 'id_account', label: 'ID' },
  { key: 'legal_number', label: 'Номер счета' },
  { key: 'date', label: 'Дата' },
] as const;

export const ACCOUNT_FORM_SCHEMA: AccountFormFieldType[] = [
  {
    key: 'legal_number',
    label: 'Номер счета',
    type: 'text',
    maxLength: 200,
    required: true,
  },
  {
    key: 'date',
    label: 'Дата создания',
    type: 'date',
    maxLength: 10,
    required: true,
    disabled: true,
  },
  { key: 'info', label: 'Комментарий', type: 'text', maxLength: 200, fullWidth: true },
];
