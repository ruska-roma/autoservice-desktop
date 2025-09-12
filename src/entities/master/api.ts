import { errorMiddleware } from '@/shared/lib/error/errorMiddleware';

export const getMastersCount = () => {
  return errorMiddleware(() => window.api.masterCount());
};
export const getMastersList = () => {
  return errorMiddleware(() => window.api.masterList());
};
export const getMasterDetails = (masterId: number) => {
  return errorMiddleware(() => window.api.masterDetails(masterId));
};
export const createMaster = (data: { name: string }) => {
  return errorMiddleware(() => window.api.masterCreate(data));
};
export const updateMaster = (id: number, data: { name: string }) => {
  return errorMiddleware(() => window.api.masterUpdate(id, data));
};
export const deleteMaster = (masterId: number) => {
  return errorMiddleware(() => window.api.masterDelete(masterId));
};
