import { errorMiddleware } from '@/shared/lib/error/errorMiddleware';

import type { CompanyType } from './types';

export const getCompanyDetails = () => {
  return errorMiddleware(() => window.api.companyDetails());
};

export const updateCompany = (data: Partial<CompanyType>) => {
  return errorMiddleware(() => window.api.companyUpdate(data));
};
