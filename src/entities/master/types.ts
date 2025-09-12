import type { FormFieldType } from '@/shared/types/form';

export type MasterType = {
  id_master: number;
  name: string;
};

export type MasterFormFieldType = FormFieldType<keyof MasterType>;
