import { errorMiddleware } from '@/shared/lib/error/errorMiddleware';

export const getDocsOrder = (accountId: number) => {
  return errorMiddleware(() => window.api.docsOrder(accountId));
};
