import { errorMiddleware } from '@/shared/lib/error/errorMiddleware';
import type { PaginationParamsType, SearchCountParamsType, SearchParamsType } from '@/shared/types';

export const getClientsCount = () => {
  return errorMiddleware(() => window.api.clientCount());
};
export const getClientsList = (params: PaginationParamsType) => {
  return errorMiddleware(() => window.api.clientList(params));
};
export const getClientDetails = (clientId: number) => {
  return errorMiddleware(() => window.api.clientDetails(clientId));
};
export const createClient = (data: Record<string, any>) => {
  return errorMiddleware(() => window.api.clientCreate(data));
};
export const updateClient = (id: number, data: Record<string, any>) => {
  return errorMiddleware(() => window.api.clientUpdate(id, data));
};
export const deleteClient = (id: number) => {
  return errorMiddleware(() => window.api.clientDelete(id));
};
export const searchClients = (params: SearchParamsType) => {
  return errorMiddleware(() => window.api.clientSearch(params));
};
export const searchClientsCount = (params: SearchCountParamsType) => {
  return errorMiddleware(() => window.api.clientSearchCount(params));
};
