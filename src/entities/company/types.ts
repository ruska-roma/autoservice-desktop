import type { FormFieldType } from '@/shared/types/form';

export type CompanyType = {
  id_companydetails: number;
  legal_name: string;
  short_name: string;
  address: string;
  inn: string;
  kpp: string;
  phone: string;
  founded_at: string;
};

export type CompanyFormFieldType = FormFieldType<keyof CompanyType>;
