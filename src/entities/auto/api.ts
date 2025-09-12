import { errorMiddleware } from '@/shared/lib/error/errorMiddleware';
import type { PaginationParamsType, SearchCountParamsType, SearchParamsType } from '@/shared/types';

export const getAutosCount = () => {
  return errorMiddleware(() => window.api.autoCount());
};
export const getAutosList = (params: PaginationParamsType) => {
  return errorMiddleware(() => window.api.autoList(params));
};
export const getAutoDetails = (autoId: number) => {
  return errorMiddleware(() => window.api.autoDetails(autoId));
};
export const createAuto = (data: Record<string, any>) => {
  return errorMiddleware(() => window.api.autoCreate(data));
};
export const updateAuto = (id: number, data: Record<string, any>) => {
  return errorMiddleware(() => window.api.autoUpdate(id, data));
};
export const deleteAuto = (id: number) => {
  return errorMiddleware(() => window.api.autoDelete(id));
};
export const searchAutos = (params: SearchParamsType) => {
  return errorMiddleware(() => window.api.autoSearch(params));
};
export const searchAutosCount = (params: SearchCountParamsType) => {
  return errorMiddleware(() => window.api.autoSearchCount(params));
};
