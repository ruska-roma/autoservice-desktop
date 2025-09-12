import type { FormFieldType } from '@/shared/types';

import type { ExtPartType } from '../part';
import type { ExtWorkType } from '../work';

export type AccountType = {
  id_account: number;
  id_auto: number;
  date: string;
  legal_number: string;
  info: string | null;
};

export type ExtAccountType = AccountType & { auto_vin: string };

export type AccountDetailsType = AccountType & { works: ExtWorkType[]; parts: ExtPartType[] };

export type AccountFormFieldType = FormFieldType<keyof AccountType>;
