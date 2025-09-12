import { errorMiddleware } from '@/shared/lib/error/errorMiddleware';

export const createWork = (data: Record<string, any>) => {
  return errorMiddleware(() => window.api.workCreate(data));
};
export const updateWork = (id: number, data: Record<string, any>) => {
  return errorMiddleware(() => window.api.workUpdate(id, data));
};
export const deleteWork = (id: number) => {
  return errorMiddleware(() => window.api.workDelete(id));
};
