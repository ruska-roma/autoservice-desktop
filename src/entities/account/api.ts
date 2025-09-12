import { errorMiddleware } from '@/shared/lib/error/errorMiddleware';
import type { PaginationParamsType, SearchCountParamsType, SearchParamsType } from '@/shared/types';

export const getAccountClient = (accountId: number) => {
  return errorMiddleware(() => window.api.accountClient(accountId));
};
export const getAccountsCount = () => {
  return errorMiddleware(() => window.api.accountCount());
};
export const getAccountsList = (params: PaginationParamsType) => {
  return errorMiddleware(() => window.api.accountList(params));
};
export const getAccountDetails = (accountId: number) => {
  return errorMiddleware(() => window.api.accountDetails(accountId));
};
export const createAccount = (data: Record<string, any>) => {
  return errorMiddleware(() => window.api.accountCreate(data));
};
export const updateAccount = (id: number, data: Record<string, any>) => {
  return errorMiddleware(() => window.api.accountUpdate(id, data));
};
export const deleteAccount = (id: number) => {
  return errorMiddleware(() => window.api.accountDelete(id));
};
export const searchAccounts = (params: SearchParamsType) => {
  return errorMiddleware(() => window.api.accountSearch(params));
};
export const searchAccountsCount = (params: SearchCountParamsType) => {
  return errorMiddleware(() => window.api.accountSearchCount(params));
};
