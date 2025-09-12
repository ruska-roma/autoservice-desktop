import type { FormFieldType } from '@/shared/types';

export type WorkType = {
  id_work: number;
  id_account: number;
  id_master: number | null;
  description: string;
  work_cost: number;
  work_hours: number;
  discount: number;
  date: string;
};

export type ExtWorkType = WorkType & {
  master_name: string | null;
  total_work_cost: number;
  discount_display: string | null;
};

export type WorkFormFieldType = FormFieldType<keyof WorkType>;
