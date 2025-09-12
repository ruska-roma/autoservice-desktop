import type { FormFieldType } from '@/shared/types/form';

export type AutoType = {
  id_auto: number;
  id_client: number;
  vin: string;
  plate_number: string;
  brand: string | null;
  model: string | null;
};

export type ExtAutoType = AutoType & { client_name: string };

export type AutoFormFieldType = FormFieldType<keyof AutoType>;
