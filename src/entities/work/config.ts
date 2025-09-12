import type { WorkFormFieldType } from './types';

export const WORK_TABLE_NAME = 't_work' as const;

export const WORK_TABLE_COLUMNS = [
  { key: 'id_work', label: 'ID' },
  { key: 'description', label: 'Наименование' },
  { key: 'master_name', label: 'Мастер' },
  { key: 'date', label: 'Дата выполнения' },
  { key: 'work_hours', label: 'Кол-во (часов)' },
  { key: 'work_cost', label: 'Цена' },
  { key: 'discount_display', label: 'Скидка' },
  { key: 'total_work_cost', label: 'Сумма' },
] as const;

export const WORK_FORM_SCHEMA: WorkFormFieldType[] = [
  {
    key: 'description',
    label: 'Наименование',
    type: 'text',
    maxLength: 200,
    required: true,
    fullWidth: true,
  },
  {
    key: 'work_hours',
    label: 'Кол-во (нормо-часов)',
    type: 'text',
    mask: 'number',
    maxLength: 6,
    required: true,
  },
  {
    key: 'date',
    label: 'Дата выполнения',
    type: 'date',
    maxLength: 10,
    required: true,
  },
  {
    key: 'work_cost',
    label: 'Цена (нормо-час), ₽',
    type: 'text',
    mask: 'cost',
    maxLength: 10,
    required: true,
    disabled: true,
  },
  {
    key: 'discount',
    label: 'Скидка, %',
    type: 'text',
    mask: 'percent',
    maxLength: 5,
  },
  {
    key: 'id_master',
    label: 'Мастер',
    type: 'select',
    maxLength: 200,
    required: true,
    fullWidth: true,
  },
];
