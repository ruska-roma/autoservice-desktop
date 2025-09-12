import type { PartFormFieldType } from './types';

export const PART_TABLE_NAME = 't_part' as const;

export const PART_TABLE_COLUMNS = [
  { key: 'id_part', label: 'ID' },
  { key: 'description', label: 'Наименование' },
  { key: 'id_work', label: 'ID работы' },
  { key: 'part_unit', label: 'Ед. изм.' },
  { key: 'part_count', label: 'Кол-во' },
  { key: 'part_cost', label: 'Цена' },
  { key: 'discount_display', label: 'Скидка' },
  { key: 'total_part_cost', label: 'Сумма' },
] as const;

export const CREATE_PART_FORM_SCHEMA: PartFormFieldType[] = [
  {
    key: 'description',
    label: 'Наименование',
    type: 'text',
    maxLength: 200,
    required: true,
    fullWidth: true,
  },
  {
    key: 'part_unit',
    label: 'Ед. изм.',
    type: 'select',
    options: ['шт.', 'кг.', 'л.'],
    maxLength: 10,
    required: true,
  },
  {
    key: 'part_count',
    label: 'Кол-во',
    type: 'text',
    mask: 'number',
    maxLength: 6,
    required: true,
  },
  {
    key: 'part_cost',
    label: 'Цена, ₽',
    type: 'text',
    mask: 'cost',
    maxLength: 10,
    required: true,
  },
  {
    key: 'discount',
    label: 'Скидка, %',
    type: 'text',
    mask: 'percent',
    maxLength: 5,
  },
];

export const EDIT_PART_FORM_SCHEMA: PartFormFieldType[] = [
  {
    key: 'description',
    label: 'Наименование',
    type: 'text',
    maxLength: 200,
    required: true,
    fullWidth: true,
  },
  {
    key: 'part_unit',
    label: 'Ед. изм.',
    type: 'text',
    maxLength: 10,
    required: true,
  },
  {
    key: 'part_count',
    label: 'Кол-во',
    type: 'text',
    mask: 'number',
    maxLength: 6,
    required: true,
  },
  {
    key: 'part_cost',
    label: 'Цена, ₽',
    type: 'text',
    mask: 'cost',
    maxLength: 10,
    required: true,
  },
  {
    key: 'discount',
    label: 'Скидка, %',
    type: 'text',
    mask: 'percent',
    maxLength: 5,
  },
];
