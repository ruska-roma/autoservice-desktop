import { errorMiddleware } from '@/shared/lib/error/errorMiddleware';

export const createPart = (data: Record<string, any>) => {
  return errorMiddleware(() => window.api.partCreate(data));
};
export const updatePart = (id: number, data: Record<string, any>) => {
  return errorMiddleware(() => window.api.partUpdate(id, data));
};
export const deletePart = (id: number) => {
  return errorMiddleware(() => window.api.partDelete(id));
};
