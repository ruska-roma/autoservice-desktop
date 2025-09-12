import type { FormFieldType } from '@/shared/types';

export type PartType = {
  id_part: number;
  id_work: number;
  description: string;
  part_unit: string | null;
  part_count: number;
  part_cost: number;
  discount: number;
};

export type ExtPartType = PartType & {
  total_part_cost: number;
  discount_display: string | null;
};

export type PartFormFieldType = FormFieldType<keyof PartType>;
