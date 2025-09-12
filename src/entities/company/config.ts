import type { CompanyFormFieldType } from './types';

export const COMPANY_TABLE_NAME = 't_companyessentials' as const;

export const COMPANY_FORM_SCHEMA: CompanyFormFieldType[] = [
  {
    key: 'legal_name',
    label: 'Полное наименование',
    type: 'text',
    required: true,
    maxLength: 200,
    fullWidth: true,
  },
  {
    key: 'short_name',
    label: 'Краткое наименование',
    type: 'text',
    required: true,
    maxLength: 200,
  },
  {
    key: 'phone',
    label: 'Телефон',
    type: 'text',
    required: true,
    maxLength: 20,
    mask: '8-XXX-XXX-XX-XX',
  },
  {
    key: 'address',
    label: 'Юридический адрес',
    type: 'text',
    required: true,
    maxLength: 200,
    fullWidth: true,
  },
  {
    key: 'inn',
    label: 'ИНН',
    type: 'text',
    required: true,
    maxLength: 20,
  },
  {
    key: 'kpp',
    label: 'КПП',
    type: 'text',
    required: true,
    maxLength: 20,
  },
];
