import type { MasterFormFieldType } from './types';

export const MASTER_TABLE_NAME = 't_master' as const;

export const MASTER_TABLE_COLUMNS = [
  { key: 'id_master', label: 'ID' },
  { key: 'name', label: 'ФИО' },
] as const;

export const MASTER_FORM_SCHEMA: MasterFormFieldType[] = [
  { key: 'name', label: 'ФИО', type: 'text', required: true, maxLength: 200 },
];
