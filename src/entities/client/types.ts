import type { FormFieldType } from '@/shared/types/form';

import type { AccountType } from '../account';
import type { AutoType } from '../auto';

export type ClientType = {
  id_client: number;
  name: string;
  phone: string;
  address: string | null;
  info: string | null;
};

export type ExtClientType = ClientType & {
  autos: AutoType[];
  accounts: AccountType[];
};

export type ClientFormFieldType = FormFieldType<keyof ClientType>;
